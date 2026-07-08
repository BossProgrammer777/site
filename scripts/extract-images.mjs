// ---------------------------------------------------------------------------
// Формирование карточных фото при СБОРКЕ.
//  ОСНОВНОЕ  — встроенные в ячейки студийные фото из .xlsx-экспорта (единый
//              стиль главных фото, как задумал продавец).
//  ЗАПАСНОЕ  — если .xlsx недоступен или у товара нет встроенного фото, берём
//              первое фото из папки Google Drive (колонка «Медіа»).
//
// Пишет public/photos/manifest.json: slug → (номер строки → URL/путь фото).
// Ошибки НЕ роняют сборку. При полном сбое остаётся закоммиченный fallback.
// ---------------------------------------------------------------------------

import { unzipSync } from 'fflate';
import fs from 'fs';
import path from 'path';

const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID || '1JRAYTZNtYiNgJE6lT1DPpG9eeXP2PUxQcqG-0Hyg0JE';
const KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_SHEETS_API_KEY || '';

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
const slugByTitle = new Map(SHEETS.map((s) => [s.title, s.slug]));

const OUT_DIR = path.join(process.cwd(), 'public', 'photos');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');
const dec = (b) => new TextDecoder('utf-8').decode(b);

function ensureEmptyManifest() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (!fs.existsSync(MANIFEST)) fs.writeFileSync(MANIFEST, '{}');
}

// ---------------- .xlsx: встроенные фото ------------------------------------
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const DOCS_EXPORT = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;

async function fetchXlsxOnce() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180000);
  try {
    const res = await fetch(DOCS_EXPORT, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': UA, Accept: 'application/octet-stream,*/*' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    if (!(buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b)) throw new Error('не .xlsx');
    return buf;
  } finally {
    clearTimeout(timer);
  }
}
async function downloadXlsx() {
  let lastErr;
  for (let a = 1; a <= 5; a++) {
    try {
      return await fetchXlsxOnce();
    } catch (e) {
      lastErr = e;
      console.warn(`[extract-images] xlsx спроба ${a}/5: ${e.message}`);
      if (a < 5) await new Promise((r) => setTimeout(r, a * 4000));
    }
  }
  throw lastErr;
}
function extInfo(name) {
  const ext = (name.split('.').pop() || 'bin').toLowerCase();
  return ext === 'jpeg' ? 'jpg' : ext;
}
function buildAnchors(files) {
  const workbook = files['xl/workbook.xml'] ? dec(files['xl/workbook.xml']) : '';
  const order = [];
  for (const m of workbook.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g))
    order.push({ name: m[1], rId: m[2] });
  const wbRels = files['xl/_rels/workbook.xml.rels'] ? dec(files['xl/_rels/workbook.xml.rels']) : '';
  const rIdTarget = new Map();
  for (const m of wbRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g))
    rIdTarget.set(m[1], m[2].replace(/^\/?xl\//, ''));

  const result = new Map();
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
    for (const m of wsRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g))
      drawRelTarget.set(m[1], m[2]);
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
    for (const m of drawRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g))
      embedMedia.set(m[1], `xl/${m[2].replace(/^\.\.\//, '')}`);
    const anchors = [];
    for (const a of drawXml.matchAll(
      /<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>[\s\S]*?<\/xdr:from>[\s\S]*?r:embed="([^"]+)"/g,
    )) {
      const mediaPath = embedMedia.get(a[2]);
      if (mediaPath && files[mediaPath]) anchors.push({ row: parseInt(a[1], 10), mediaPath });
    }
    result.set(name, anchors);
  }
  return result;
}

// ---------------- Drive: запасное фото из папки -----------------------------
const folderRe = /\/folders\/([a-zA-Z0-9_-]+)/;
function folderIdFromCells(cells) {
  for (const c of cells || []) {
    if (c.hyperlink) {
      const m = c.hyperlink.match(folderRe);
      if (m) return m[1];
    }
    const f = c.userEnteredValue?.formulaValue;
    if (f) {
      const m = f.match(folderRe);
      if (m) return m[1];
    }
  }
  return null;
}
async function fetchAllSheets() {
  const params = new URLSearchParams();
  params.set('includeGridData', 'true');
  params.set('fields', 'sheets(properties(title),data(rowData(values(hyperlink,userEnteredValue))))');
  for (const s of SHEETS) params.append('ranges', s.title);
  params.set('key', KEY);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?${params}`);
  if (!res.ok) throw new Error(`Sheets API ${res.status}`);
  return (await res.json()).sheets || [];
}
async function firstImageId(folderId) {
  const q = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&key=${KEY}&fields=files(id,name)&orderBy=name&pageSize=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()).files?.[0]?.id || null;
  } catch {
    return null;
  }
}
async function mapPool(items, limit, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length || 1) }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}
const proxied = (id) =>
  `/api/img?src=${encodeURIComponent(`https://lh3.googleusercontent.com/d/${id}=w1000`)}`;

// ---------------- main ------------------------------------------------------
async function main() {
  ensureEmptyManifest();
  if (!KEY) {
    console.warn('[extract-images] немає GOOGLE_API_KEY — плейсхолдери.');
    return;
  }
  const manifest = {};

  // 1) Встроенные студийные фото из .xlsx (основные).
  let embedded = 0;
  try {
    console.log('[extract-images] завантажую .xlsx зі вбудованими фото…');
    const files = unzipSync(await downloadXlsx());
    for (const [title, anchors] of buildAnchors(files)) {
      const slug = slugByTitle.get(title);
      const dir = path.join(OUT_DIR, slug);
      if (anchors.length) fs.mkdirSync(dir, { recursive: true });
      for (const { row, mediaPath } of anchors) {
        const ext = extInfo(mediaPath);
        fs.writeFileSync(path.join(dir, `${row}.${ext}`), Buffer.from(files[mediaPath]));
        (manifest[slug] ||= {})[row] = `/photos/${slug}/${row}.${ext}`;
        embedded += 1;
      }
    }
    console.log(`[extract-images] вбудованих фото: ${embedded}`);
  } catch (e) {
    console.warn('[extract-images] .xlsx недоступний, лишаються Drive-фото:', e.message);
  }

  // 2) Drive-фолбэк для строк без встроенного фото.
  try {
    const sheetsData = await fetchAllSheets();
    const tasks = [];
    for (const sh of sheetsData) {
      const slug = slugByTitle.get(sh.properties?.title);
      if (!slug) continue;
      (sh.data?.[0]?.rowData || []).forEach((row, r) => {
        if (manifest[slug]?.[r]) return; // уже есть встроенное фото
        const fid = folderIdFromCells(row.values);
        if (fid) tasks.push({ slug, r, fid });
      });
    }
    console.log(`[extract-images] Drive-фолбэк для ${tasks.length} товарів…`);
    let drive = 0;
    await mapPool(tasks, 12, async (t) => {
      const id = await firstImageId(t.fid);
      if (!id) return;
      (manifest[t.slug] ||= {})[t.r] = proxied(id);
      drive += 1;
    });
    console.log(`[extract-images] Drive-фото: ${drive}`);
  } catch (e) {
    console.warn('[extract-images] Drive-фолбэк пропущено:', e.message);
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest));
  console.log('[extract-images] манифест записаний.');
}

main();
