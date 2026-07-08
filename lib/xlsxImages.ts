// ---------------------------------------------------------------------------
// Запасной способ получить фото, если они вставлены в ячейки как объекты
// (а не формулами =IMAGE). Экспортируем таблицу в .xlsx, распаковываем как zip
// и достаём картинки из /xl/media, сопоставляя их с листами и строками через
// drawing*.xml. Работает только при наличии сети до Google (в изолированной
// среде разработки docs/drive могут быть недоступны) — все ошибки заглушаются,
// а фронт показывает плейсхолдер.
// ---------------------------------------------------------------------------

import { unzipSync } from 'fflate';
import { SPREADSHEET_ID, SheetDef } from './config';
import { getAccessToken } from './googleAuth';

export interface SheetImageMap {
  /** Фото по коду товара (если удалось сопоставить). */
  byCode: Map<string, string>;
  /** Фото в порядке сверху вниз (индекс → data URL). */
  byRowOrder: string[];
}

const DRIVE_EXPORT = `https://www.googleapis.com/drive/v3/files/${SPREADSHEET_ID}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
const DOCS_EXPORT = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;

async function downloadXlsx(): Promise<Uint8Array | null> {
  const token = await getAccessToken().catch(() => null);
  // Предпочитаем Drive API (работает через фаервол-политику облака).
  const attempts: { url: string; headers?: Record<string, string> }[] = [];
  if (token) attempts.push({ url: DRIVE_EXPORT, headers: { Authorization: `Bearer ${token}` } });
  attempts.push({ url: DOCS_EXPORT }); // публичная таблица, без ключа

  for (const a of attempts) {
    try {
      const res = await fetch(a.url, { headers: a.headers, cache: 'no-store' });
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
    } catch {
      /* пробуем следующий источник */
    }
  }
  return null;
}

function mediaContentType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  return 'application/octet-stream';
}

function toDataUrl(bytes: Uint8Array, name: string): string {
  return `data:${mediaContentType(name)};base64,${Buffer.from(bytes).toString('base64')}`;
}

const dec = (b: Uint8Array) => new TextDecoder('utf-8').decode(b);

/**
 * Строит соответствие: имя листа → SheetImageMap.
 * Разбор xlsx-структуры: workbook.xml (лист→sheetN), _rels (worksheet→drawing),
 * drawingN.xml (anchor row → rId), drawingN.xml.rels (rId → media/*).
 */
export async function extractEmbeddedImages(
  sheets: SheetDef[],
): Promise<Map<string, SheetImageMap>> {
  const result = new Map<string, SheetImageMap>();
  const xlsx = await downloadXlsx();
  if (!xlsx) return result;

  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(xlsx);
  } catch {
    return result;
  }

  // 1. workbook.xml: порядок листов и их имена.
  const workbook = files['xl/workbook.xml'] ? dec(files['xl/workbook.xml']) : '';
  const sheetOrder: { name: string; rId: string }[] = [];
  for (const m of workbook.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
    sheetOrder.push({ name: m[1], rId: m[2] });
  }

  // 2. workbook.xml.rels: rId → worksheets/sheetN.xml
  const wbRels = files['xl/_rels/workbook.xml.rels']
    ? dec(files['xl/_rels/workbook.xml.rels'])
    : '';
  const rIdToTarget = new Map<string, string>();
  for (const m of wbRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
    rIdToTarget.set(m[1], m[2].replace(/^\/?xl\//, ''));
  }

  for (const { name, rId } of sheetOrder) {
    if (!sheets.some((s) => s.title === name)) continue;
    const wsPath = rIdToTarget.get(rId); // например worksheets/sheet1.xml
    if (!wsPath) continue;
    const wsFile = `xl/${wsPath}`;
    const wsName = wsPath.split('/').pop()!; // sheet1.xml
    const wsRelsPath = `xl/worksheets/_rels/${wsName}.rels`;
    const wsRels = files[wsRelsPath] ? dec(files[wsRelsPath]) : '';

    // worksheet → drawing rId → drawings/drawingN.xml
    const drawRelTarget = new Map<string, string>();
    for (const m of wsRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
      drawRelTarget.set(m[1], m[2]);
    }
    const wsXml = files[wsFile] ? dec(files[wsFile]) : '';
    const drawRef = wsXml.match(/<drawing[^>]*r:id="([^"]+)"/);
    if (!drawRef) continue;
    let drawTarget = drawRelTarget.get(drawRef[1]);
    if (!drawTarget) continue;
    drawTarget = drawTarget.replace(/^\.\.\//, '').replace(/^\/?xl\//, '');
    const drawFile = `xl/${drawTarget}`; // drawings/drawing1.xml
    const drawName = drawTarget.split('/').pop()!;
    const drawXml = files[drawFile] ? dec(files[drawFile]) : '';
    const drawRelsFile = `xl/drawings/_rels/${drawName}.rels`;
    const drawRels = files[drawRelsFile] ? dec(files[drawRelsFile]) : '';

    const embedToMedia = new Map<string, string>();
    for (const m of drawRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
      const target = m[2].replace(/^\.\.\//, ''); // media/image1.png
      embedToMedia.set(m[1], `xl/${target}`);
    }

    // Каждый anchor: <xdr:from><xdr:row>R</xdr:row> … r:embed="rIdX"
    const anchors: { row: number; embed: string }[] = [];
    for (const a of drawXml.matchAll(
      /<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>[\s\S]*?<\/xdr:from>[\s\S]*?r:embed="([^"]+)"/g,
    )) {
      anchors.push({ row: parseInt(a[1], 10), embed: a[2] });
    }
    anchors.sort((x, y) => x.row - y.row);

    const byRowOrder: string[] = [];
    for (const anchor of anchors) {
      const mediaPath = embedToMedia.get(anchor.embed);
      if (!mediaPath || !files[mediaPath]) continue;
      byRowOrder.push(toDataUrl(files[mediaPath], mediaPath));
    }

    result.set(name, { byCode: new Map(), byRowOrder });
  }

  return result;
}
