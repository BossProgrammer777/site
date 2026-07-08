// ---------------------------------------------------------------------------
// Извлечение вставленных в ячейки фото при СБОРКЕ (не в рантайме).
// Скачивает публичный .xlsx-экспорт таблицы один раз, распаковывает, достаёт
// картинки из /xl/media и раскладывает их в public/photos/<slug>/<row>.<ext>,
// а соответствие «раздел → строка → файл» пишет в public/photos/manifest.json.
// Затем сайт отдаёт фото как обычные статические файлы через CDN — быстро и
// надёжно, без скачивания xlsx на каждый запрос.
//
// Любая ошибка НЕ роняет сборку: пишется пустой манифест → показываются
// плейсхолдеры, остальной каталог работает.
// ---------------------------------------------------------------------------

import { unzipSync } from 'fflate';
import fs from 'fs';
import path from 'path';

const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID || '1JRAYTZNtYiNgJE6lT1DPpG9eeXP2PUxQcqG-0Hyg0JE';

// Должно совпадать с SHEETS в lib/config.ts (title → slug).
const SHEETS = [
  { title: 'БУТСИ', slug: 'butsy' },
  { title: 'СОРОКОНІЖКИ', slug: 'sorokonizhky' },
  { title: 'ФУТЗАЛКИ', slug: 'futzalky' },
  { title: 'ДИТЯЧЕ ВЗУТТЯ', slug: 'dytiache-vzuttia' },
  { title: 'ЕКІПІРУВАННЯ', slug: 'ekipiruvannia' },
  { title: 'НБ ВЗУТТЯ', slug: 'nb-vzuttia' },
  { title: 'НБ ДИТЯЧЕ ВЗУТТЯ', slug: 'nb-dytiache-vzuttia' },
  { title: 'НБ ЕКІПІРУВАННЯ', slug: 'nb-ekipiruvannia' },
];

const OUT_DIR = path.join(process.cwd(), 'public', 'photos');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');
const DOCS_EXPORT = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;

const dec = (b) => new TextDecoder('utf-8').decode(b);
const slugByTitle = new Map(SHEETS.map((s) => [s.title, s.slug]));

function ensureEmptyManifest() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (!fs.existsSync(MANIFEST)) fs.writeFileSync(MANIFEST, '{}');
}

function extInfo(name) {
  const ext = (name.split('.').pop() || 'bin').toLowerCase();
  return ext === 'jpeg' ? 'jpg' : ext;
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

async function fetchXlsxOnce() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000); // 2 мин
  try {
    const res = await fetch(DOCS_EXPORT, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': UA,
        Accept:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*',
      },
    });
    const ctype = res.headers.get('content-type') || '';
    console.log(`[extract-images] response: HTTP ${res.status}, type=${ctype}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    // .xlsx — это zip: первые байты "PK". Иначе Google вернул HTML-заглушку и т.п.
    const isZip = buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b;
    if (!isZip) {
      throw new Error(`не .xlsx (size=${buf.length}, начало="${dec(buf.slice(0, 40))}")`);
    }
    return buf;
  } finally {
    clearTimeout(timer);
  }
}

async function download() {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetchXlsxOnce();
    } catch (e) {
      lastErr = e;
      console.warn(`[extract-images] попытка ${attempt}/3 не удалась: ${e.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 4000));
    }
  }
  throw lastErr;
}

function buildAnchors(files) {
  // workbook.xml: порядок листов и r:id
  const workbook = files['xl/workbook.xml'] ? dec(files['xl/workbook.xml']) : '';
  const order = [];
  for (const m of workbook.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
    order.push({ name: m[1], rId: m[2] });
  }
  const wbRels = files['xl/_rels/workbook.xml.rels']
    ? dec(files['xl/_rels/workbook.xml.rels'])
    : '';
  const rIdTarget = new Map();
  for (const m of wbRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
    rIdTarget.set(m[1], m[2].replace(/^\/?xl\//, ''));
  }

  const result = new Map(); // title → [{ row, mediaPath }]
  for (const { name, rId } of order) {
    if (!slugByTitle.has(name)) continue;
    const wsPath = rIdTarget.get(rId);
    if (!wsPath) continue;
    const wsName = wsPath.split('/').pop();
    const wsXml = files[`xl/${wsPath}`] ? dec(files[`xl/${wsPath}`]) : '';
    const wsRels = files[`xl/worksheets/_rels/${wsName}.rels`]
      ? dec(files[`xl/worksheets/_rels/${wsName}.rels`])
      : '';
    const drawRelTarget = new Map();
    for (const m of wsRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
      drawRelTarget.set(m[1], m[2]);
    }
    const drawRef = wsXml.match(/<drawing[^>]*r:id="([^"]+)"/);
    if (!drawRef) continue;
    let drawTarget = drawRelTarget.get(drawRef[1]);
    if (!drawTarget) continue;
    drawTarget = drawTarget.replace(/^\.\.\//, '').replace(/^\/?xl\//, '');
    const drawName = drawTarget.split('/').pop();
    const drawXml = files[`xl/${drawTarget}`] ? dec(files[`xl/${drawTarget}`]) : '';
    const drawRels = files[`xl/drawings/_rels/${drawName}.rels`]
      ? dec(files[`xl/drawings/_rels/${drawName}.rels`])
      : '';
    const embedMedia = new Map();
    for (const m of drawRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
      embedMedia.set(m[1], `xl/${m[2].replace(/^\.\.\//, '')}`);
    }
    const anchors = [];
    for (const a of drawXml.matchAll(
      /<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>[\s\S]*?<\/xdr:from>[\s\S]*?r:embed="([^"]+)"/g,
    )) {
      const row = parseInt(a[1], 10);
      const mediaPath = embedMedia.get(a[2]);
      if (mediaPath && files[mediaPath]) anchors.push({ row, mediaPath });
    }
    result.set(name, anchors);
  }
  return result;
}

async function main() {
  ensureEmptyManifest();
  try {
    console.log('[extract-images] downloading xlsx…');
    const xlsx = await download();
    console.log(`[extract-images] xlsx size: ${(xlsx.length / 1e6).toFixed(1)} MB`);
    const files = unzipSync(xlsx);
    const anchorsByTitle = buildAnchors(files);

    const manifest = {};
    let total = 0;
    for (const { title, slug } of SHEETS) {
      const anchors = anchorsByTitle.get(title) || [];
      if (!anchors.length) continue;
      const dir = path.join(OUT_DIR, slug);
      fs.mkdirSync(dir, { recursive: true });
      manifest[slug] = {};
      for (const { row, mediaPath } of anchors) {
        const ext = extInfo(mediaPath);
        const fname = `${row}.${ext}`;
        fs.writeFileSync(path.join(dir, fname), Buffer.from(files[mediaPath]));
        manifest[slug][row] = fname;
        total += 1;
      }
      console.log(`[extract-images] ${title}: ${anchors.length} фото`);
    }
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest));
    console.log(`[extract-images] готово: ${total} фото, манифест записан.`);
  } catch (err) {
    console.warn('[extract-images] пропущено (фото будут плейсхолдерами):', err.message);
    ensureEmptyManifest();
  }
}

main();
