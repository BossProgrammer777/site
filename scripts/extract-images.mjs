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
import os from 'os';
import path from 'path';
import sharp from 'sharp';

// Сжатие карточного фото: ресайз под витрину + WebP. Тяжёлые студийные PNG
// (по 700+ КБ, 800×600) превращаются в ~50–80 КБ WebP — это резко ускоряет
// мобильную загрузку (LCP). При любой ошибке возвращаем оригинал, чтобы сборка
// не падала.
async function toWebp(input) {
  return sharp(input, { failOn: 'none' })
    .rotate()
    .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

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

// Докачиваемая потоковая загрузка .xlsx на диск.
//  .xlsx с встроенными фото весит ~227 МБ — один монолитный запрос часто рвётся
//  на docs.google.com. Поэтому качаем в файл частями через HTTP Range: обрыв
//  теряет не весь файл, а только «хвост», и мы докачиваем с места разрыва.
//  Плюс потоковая запись на диск не держит 227 МБ в памяти билда.
const STALL_MS = 60000; // нет данных дольше — считаем соединение зависшим
const MAX_ATTEMPTS = 8;

async function downloadRangeOnce(dest, fromByte) {
  const controller = new AbortController();
  let stall = setTimeout(() => controller.abort(), STALL_MS);
  const bump = () => {
    clearTimeout(stall);
    stall = setTimeout(() => controller.abort(), STALL_MS);
  };
  try {
    const headers = { 'User-Agent': UA, Accept: 'application/octet-stream,*/*' };
    if (fromByte > 0) headers.Range = `bytes=${fromByte}-`;
    const res = await fetch(DOCS_EXPORT, {
      redirect: 'follow',
      signal: controller.signal,
      headers,
    });
    if (!(res.status === 200 || res.status === 206)) throw new Error(`HTTP ${res.status}`);
    // Сервер проигнорировал Range (отдал 200 вместо 206) — начинаем файл заново.
    const append = res.status === 206 && fromByte > 0;
    const total = (() => {
      const cr = res.headers.get('content-range');
      if (cr) {
        const m = cr.match(/\/(\d+)\s*$/);
        if (m) return parseInt(m[1], 10);
      }
      const cl = res.headers.get('content-length');
      return cl ? (append ? fromByte : 0) + parseInt(cl, 10) : 0;
    })();
    const fd = fs.openSync(dest, append ? 'a' : 'w');
    try {
      for await (const chunk of res.body) {
        fs.writeSync(fd, chunk);
        bump();
      }
    } finally {
      fs.closeSync(fd);
    }
    return { size: fs.statSync(dest).size, total };
  } finally {
    clearTimeout(stall);
  }
}

async function downloadXlsx() {
  const dest = path.join(os.tmpdir(), `bootsbaza-${SPREADSHEET_ID}.xlsx`);
  try {
    fs.rmSync(dest, { force: true });
  } catch {}
  let lastErr;
  let total = 0;
  for (let a = 1; a <= MAX_ATTEMPTS; a++) {
    const from = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
    try {
      const r = await downloadRangeOnce(dest, from);
      if (r.total) total = r.total;
      // Скачали всё (или сервер не сообщил размер, но поток дошёл до конца).
      if (!total || r.size >= total) {
        const size = fs.statSync(dest).size;
        if (size < 5) throw new Error('порожній файл');
        const head = Buffer.alloc(4);
        const fd = fs.openSync(dest, 'r');
        fs.readSync(fd, head, 0, 4, 0);
        fs.closeSync(fd);
        if (!(head[0] === 0x50 && head[1] === 0x4b)) throw new Error('не .xlsx');
        console.log(`[extract-images] .xlsx завантажено: ${(size / 1048576).toFixed(1)} МБ`);
        return { dest, size };
      }
      console.warn(
        `[extract-images] xlsx неповний ${(r.size / 1048576).toFixed(1)}/${(total / 1048576).toFixed(1)} МБ — докачую`,
      );
    } catch (e) {
      lastErr = e;
      const now = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
      console.warn(
        `[extract-images] xlsx спроба ${a}/${MAX_ATTEMPTS} (${(now / 1048576).toFixed(1)} МБ): ${e.message}`,
      );
      if (a < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, Math.min(a * 3000, 12000)));
    }
  }
  throw lastErr || new Error('не вдалося завантажити .xlsx');
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
    const { dest } = await downloadXlsx();
    const files = unzipSync(new Uint8Array(fs.readFileSync(dest)));
    try {
      fs.rmSync(dest, { force: true });
    } catch {}
    for (const [title, anchors] of buildAnchors(files)) {
      const slug = slugByTitle.get(title);
      const dir = path.join(OUT_DIR, slug);
      if (anchors.length) fs.mkdirSync(dir, { recursive: true });
      for (const { row, mediaPath } of anchors) {
        const input = Buffer.from(files[mediaPath]);
        let outName;
        let outBuf;
        try {
          outBuf = await toWebp(input);
          outName = `${row}.webp`;
        } catch (e) {
          // Не удалось сжать — кладём оригинал, чтобы фото не пропало.
          outBuf = input;
          outName = `${row}.${extInfo(mediaPath)}`;
        }
        fs.writeFileSync(path.join(dir, outName), outBuf);
        (manifest[slug] ||= {})[row] = `/photos/${slug}/${outName}`;
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
