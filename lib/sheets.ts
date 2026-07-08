// ---------------------------------------------------------------------------
// Чтение данных из Google Sheets API v4 и сборка публичного каталога.
// Стратегия получения фото:
//   1) =IMAGE("url") в ячейке  → URL берём напрямую (userEnteredValue.formulaValue).
//   2) вставленные объекты      → экспорт .xlsx через Drive API и извлечение
//                                 картинок из /xl/media (см. lib/xlsxImages.ts).
//   3) fallback                 → null → на фронте показываем плейсхолдер.
// ---------------------------------------------------------------------------

import { SPREADSHEET_ID, SHEETS, SheetDef } from './config';
import { getApiKey, getAccessToken } from './googleAuth';
import { normalizeGrid, parseSheet, Cell } from './parse';
import { Catalog, Product, Section } from './types';
import { extractEmbeddedImages } from './xlsxImages';

interface RawSheetResponse {
  sheets?: {
    properties?: { title?: string };
    data?: { rowData?: any[] }[];
  }[];
}

const SHEETS_ENDPOINT = 'https://sheets.googleapis.com/v4/spreadsheets';

/** Один запрос за всеми листами (includeGridData) с нужными полями ячеек. */
async function fetchGrids(): Promise<Map<string, Cell[][]>> {
  const apiKey = getApiKey();
  const token = await getAccessToken().catch(() => null);
  if (!apiKey && !token) {
    throw new Error('Нет учётных данных Google (GOOGLE_API_KEY или сервис-аккаунт).');
  }

  const params = new URLSearchParams();
  params.set('includeGridData', 'true');
  params.set(
    'fields',
    'sheets(properties(title),data(rowData(values(userEnteredValue,effectiveValue,formattedValue,hyperlink))))',
  );
  for (const s of SHEETS) params.append('ranges', s.title);
  if (apiKey) params.set('key', apiKey);

  const res = await fetch(`${SHEETS_ENDPOINT}/${SPREADSHEET_ID}?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    // На стороне Next кэшируем сами (см. lib/cache.ts), поэтому здесь без кэша.
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Sheets API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as RawSheetResponse;

  const byTitle = new Map<string, Cell[][]>();
  for (const sh of data.sheets || []) {
    const title = sh.properties?.title;
    if (!title) continue;
    const rowData = sh.data?.[0]?.rowData;
    byTitle.set(title, normalizeGrid(rowData));
  }
  return byTitle;
}

function buildSection(sheet: SheetDef, products: Product[]): Section {
  const countries = Array.from(
    new Set(products.map((p) => p.country).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, 'uk'));
  return { slug: sheet.slug, label: sheet.label, products, countries };
}

export async function fetchLiveCatalog(): Promise<Catalog> {
  const grids = await fetchGrids();

  // Есть ли листы, где фото не пришли формулами? Тогда пробуем xlsx-фолбэк.
  const parsed = SHEETS.map((sheet) => {
    const grid = grids.get(sheet.title) ?? [];
    return { sheet, products: parseSheet(sheet, grid) };
  });

  const needImages = parsed.some((p) => p.products.some((x) => !x.image && x.anyInStock));
  if (needImages) {
    try {
      const imagesBySheet = await extractEmbeddedImages(SHEETS);
      for (const { sheet, products } of parsed) {
        const map = imagesBySheet.get(sheet.title);
        if (!map) continue;
        // Сопоставляем по абсолютной строке листа; запасной вариант — по порядку.
        products.forEach((product, idx) => {
          if (product.image) return;
          const byRow = product._row !== undefined ? map.byRow.get(product._row) : undefined;
          product.image = byRow ?? map.byRowOrder[idx] ?? null;
        });
      }
    } catch (err) {
      console.warn('[bootsbaza] xlsx image fallback failed:', (err as Error).message);
    }
  }

  // Убираем внутреннее поле _row перед отдачей наружу.
  for (const { products } of parsed) for (const p of products) delete p._row;

  const sections = parsed.map(({ sheet, products }) => buildSection(sheet, products));
  return { sections, fetchedAt: Date.now(), source: 'live' };
}
