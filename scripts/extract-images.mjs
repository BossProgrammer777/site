// ---------------------------------------------------------------------------
// Формирование карточных фото при СБОРКЕ — из папок Google Drive (колонка «Медіа»).
// Надёжно и быстро: один запрос к Sheets API за ссылками на папки + лёгкие
// запросы к Drive API за первым фото каждой папки. Никакого 227 МБ .xlsx.
//
// Пишет public/photos/manifest.json: slug → (номер строки → URL фото).
// Ошибки НЕ роняют сборку (пустой манифест → плейсхолдеры).
//
// Требует включённых Google Sheets API и Google Drive API + GOOGLE_API_KEY.
// ---------------------------------------------------------------------------

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

const OUT_DIR = path.join(process.cwd(), 'public', 'photos');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

function ensureEmptyManifest() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (!fs.existsSync(MANIFEST)) fs.writeFileSync(MANIFEST, '{}');
}

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
  const q = encodeURIComponent(
    `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
  );
  const url =
    `https://www.googleapis.com/drive/v3/files?q=${q}&key=${KEY}` +
    `&fields=files(id,name)&orderBy=name&pageSize=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = await res.json();
    return d.files?.[0]?.id || null;
  } catch {
    return null;
  }
}

// Ограниченный параллелизм.
async function mapPool(items, limit, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length || 1) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

function proxied(id) {
  return `/api/img?src=${encodeURIComponent(`https://lh3.googleusercontent.com/d/${id}=w1000`)}`;
}

async function main() {
  ensureEmptyManifest();
  if (!KEY) {
    console.warn('[extract-images] немає GOOGLE_API_KEY — плейсхолдери.');
    return;
  }
  try {
    console.log('[extract-images] читаю ссылки на папки Drive з таблиці…');
    const sheetsData = await fetchAllSheets();
    const bySlug = new Map(SHEETS.map((s) => [s.title, s.slug]));

    // Собираем задания: (slug, row, folderId)
    const tasks = [];
    for (const sh of sheetsData) {
      const slug = bySlug.get(sh.properties?.title);
      if (!slug) continue;
      const rows = sh.data?.[0]?.rowData || [];
      rows.forEach((row, r) => {
        const fid = folderIdFromCells(row.values);
        if (fid) tasks.push({ slug, r, fid });
      });
    }
    console.log(`[extract-images] папок знайдено: ${tasks.length}. Тягну перше фото кожної…`);

    const manifest = {};
    let ok = 0;
    await mapPool(tasks, 12, async (t) => {
      const id = await firstImageId(t.fid);
      if (!id) return;
      (manifest[t.slug] ||= {})[t.r] = proxied(id);
      ok += 1;
    });

    fs.writeFileSync(MANIFEST, JSON.stringify(manifest));
    console.log(`[extract-images] готово: фото для ${ok} товарів, манифест записаний.`);
  } catch (err) {
    console.warn('[extract-images] пропущено (плейсхолдери):', err.message);
    ensureEmptyManifest();
  }
}

main();
