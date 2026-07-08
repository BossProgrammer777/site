// ---------------------------------------------------------------------------
// Извлечение вставленных в ячейки фото (объектов) из листов. Sheets API их не
// отдаёт, поэтому экспортируем таблицу в .xlsx (публичный export с docs или
// Drive API через сервис-аккаунт), распаковываем zip и достаём картинки из
// /xl/media, сопоставляя их с листом и строкой через drawing*.xml.
//
// Картинки НЕ инлайнятся в каталог (это раздуло бы payload на сотнях товаров).
// Здесь — кэш «сырых» байтов по (лист, строка); отдаются они по запросу через
// /api/photo с ленивой подгрузкой. Все сетевые ошибки заглушаются → плейсхолдер.
// ---------------------------------------------------------------------------

import { unzipSync } from 'fflate';
import { SPREADSHEET_ID, SHEETS } from './config';
import { getAccessToken } from './googleAuth';

export interface ExtractedImage {
  bytes: Uint8Array;
  contentType: string;
}

/** title → (0-based номер строки листа → картинка). */
type ImageIndex = Map<string, Map<number, ExtractedImage>>;

const DRIVE_EXPORT = `https://www.googleapis.com/drive/v3/files/${SPREADSHEET_ID}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
const DOCS_EXPORT = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;

async function downloadXlsx(): Promise<Uint8Array | null> {
  const token = await getAccessToken().catch(() => null);
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

const dec = (b: Uint8Array) => new TextDecoder('utf-8').decode(b);

function buildIndex(files: Record<string, Uint8Array>): ImageIndex {
  const index: ImageIndex = new Map();

  const workbook = files['xl/workbook.xml'] ? dec(files['xl/workbook.xml']) : '';
  const sheetOrder: { name: string; rId: string }[] = [];
  for (const m of workbook.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
    sheetOrder.push({ name: m[1], rId: m[2] });
  }

  const wbRels = files['xl/_rels/workbook.xml.rels'] ? dec(files['xl/_rels/workbook.xml.rels']) : '';
  const rIdToTarget = new Map<string, string>();
  for (const m of wbRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
    rIdToTarget.set(m[1], m[2].replace(/^\/?xl\//, ''));
  }

  const wanted = new Set(SHEETS.map((s) => s.title));

  for (const { name, rId } of sheetOrder) {
    if (!wanted.has(name)) continue;
    const wsPath = rIdToTarget.get(rId);
    if (!wsPath) continue;
    const wsName = wsPath.split('/').pop()!;
    const wsXml = files[`xl/${wsPath}`] ? dec(files[`xl/${wsPath}`]) : '';
    const wsRels = files[`xl/worksheets/_rels/${wsName}.rels`]
      ? dec(files[`xl/worksheets/_rels/${wsName}.rels`])
      : '';

    const drawRelTarget = new Map<string, string>();
    for (const m of wsRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
      drawRelTarget.set(m[1], m[2]);
    }
    const drawRef = wsXml.match(/<drawing[^>]*r:id="([^"]+)"/);
    if (!drawRef) continue;
    let drawTarget = drawRelTarget.get(drawRef[1]);
    if (!drawTarget) continue;
    drawTarget = drawTarget.replace(/^\.\.\//, '').replace(/^\/?xl\//, '');
    const drawName = drawTarget.split('/').pop()!;
    const drawXml = files[`xl/${drawTarget}`] ? dec(files[`xl/${drawTarget}`]) : '';
    const drawRels = files[`xl/drawings/_rels/${drawName}.rels`]
      ? dec(files[`xl/drawings/_rels/${drawName}.rels`])
      : '';

    const embedToMedia = new Map<string, string>();
    for (const m of drawRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
      embedToMedia.set(m[1], `xl/${m[2].replace(/^\.\.\//, '')}`);
    }

    const byRow = new Map<number, ExtractedImage>();
    for (const a of drawXml.matchAll(
      /<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>[\s\S]*?<\/xdr:from>[\s\S]*?r:embed="([^"]+)"/g,
    )) {
      const row = parseInt(a[1], 10);
      const mediaPath = embedToMedia.get(a[2]);
      if (!mediaPath || !files[mediaPath]) continue;
      byRow.set(row, { bytes: files[mediaPath], contentType: mediaContentType(mediaPath) });
    }
    if (byRow.size) index.set(name, byRow);
  }

  return index;
}

// --- Кэш извлечённых картинок (одна распаковка xlsx на TTL) --------------------

const IMAGES_TTL_MS = 30 * 60 * 1000; // 30 мин
let cache: { at: number; index: ImageIndex } | null = null;
let inflight: Promise<ImageIndex> | null = null;

async function loadIndex(): Promise<ImageIndex> {
  const xlsx = await downloadXlsx();
  if (!xlsx) return new Map();
  try {
    return buildIndex(unzipSync(xlsx));
  } catch {
    return new Map();
  }
}

async function getIndex(): Promise<ImageIndex> {
  const now = Date.now();
  if (cache && now - cache.at < IMAGES_TTL_MS) return cache.index;
  if (inflight) return inflight;
  inflight = loadIndex()
    .then((index) => {
      cache = { at: Date.now(), index };
      return index;
    })
    .catch(() => cache?.index ?? new Map())
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Фото по названию листа и 0-based номеру строки. null → плейсхолдер. */
export async function getSheetPhoto(title: string, row: number): Promise<ExtractedImage | null> {
  const index = await getIndex();
  return index.get(title)?.get(row) ?? null;
}
