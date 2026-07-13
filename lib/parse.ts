// ---------------------------------------------------------------------------
// Парсинг одного листа Google Sheets (grid data из Sheets API v4) в товары.
// Поддерживаются две реальные раскладки:
//   • Обувь        — A Фото | B Код | C Назва | D Країна | E..K розміри 39-45
//                    (объединённый заголовок + номера в строке ниже) | L Ціна Дроп
//                    | M Медіа | N-O Розмірна сітка | P Примітки | Q Ціна розпродаж (игнор).
//   • Экіпіровка   — A Фото | B Код | C Назва | D Розмір | E Кількість | F Ціна Дроп
//                    | G Фото товара | H Склад | I Примітки.
// Роли колонок определяются по заголовку (по ключевым словам), объединённые
// ячейки-блоки разворачиваются до следующего именованного столбца.
// ---------------------------------------------------------------------------

import { COLUMN_KEYWORDS, SheetDef, computeFinalPrice } from './config';
import { Product, SizeAvailability } from './types';
import { productSlug } from './slug';

/** Унифицированное представление ячейки после нормализации grid data. */
export interface Cell {
  /** Отображаемый текст (formattedValue или строковое/числовое значение). */
  text: string;
  /** URL из формулы =IMAGE("…"), если есть. */
  imageUrl: string | null;
  /** Числовое значение, если ячейка числовая. */
  num: number | null;
  /** Гиперссылка ячейки (для media-колонки; обычно игнорируется). */
  hyperlink: string | null;
}

// Сырой тип ячейки из Sheets API (частично).
interface RawCell {
  userEnteredValue?: {
    stringValue?: string;
    numberValue?: number;
    boolValue?: boolean;
    formulaValue?: string;
  };
  effectiveValue?: { stringValue?: string; numberValue?: number };
  formattedValue?: string;
  hyperlink?: string;
}
interface RawRow {
  values?: RawCell[];
}

const IMAGE_FORMULA = /=\s*IMAGE\(\s*"([^"]+)"/i;

export function normalizeCell(raw: RawCell | undefined): Cell {
  if (!raw) return { text: '', imageUrl: null, num: null, hyperlink: null };

  let imageUrl: string | null = null;
  const formula = raw.userEnteredValue?.formulaValue;
  if (formula) {
    const m = formula.match(IMAGE_FORMULA);
    if (m) imageUrl = m[1];
  }

  const num =
    typeof raw.effectiveValue?.numberValue === 'number'
      ? raw.effectiveValue.numberValue
      : typeof raw.userEnteredValue?.numberValue === 'number'
        ? raw.userEnteredValue.numberValue
        : null;

  const text =
    raw.formattedValue ??
    raw.effectiveValue?.stringValue ??
    raw.userEnteredValue?.stringValue ??
    (num !== null ? String(num) : '') ??
    '';

  return {
    text: (text || '').trim(),
    imageUrl,
    num,
    hyperlink: raw.hyperlink ?? null,
  };
}

export function normalizeGrid(rowData: RawRow[] | undefined): Cell[][] {
  if (!rowData) return [];
  return rowData.map((r) => (r.values || []).map(normalizeCell));
}

// ---------------------------------------------------------------------------
// Определение ролей колонок
// ---------------------------------------------------------------------------

interface ColumnMap {
  photo: number;
  code: number;
  name: number;
  country: number;
  price: number;
  notes: number;
  material: number;
  media: number;
  sizeGrid: number[];
  /** Посетевые размеры (обувь). */
  sizeCols: { index: number; label: string }[];
  /** Одиночная колонка размера (экипировка) либо -1. */
  gearSize: number;
  /** Колонка количества (экипировка) либо -1. */
  quantity: number;
  headerRowIndex: number;
}

function matchesAny(text: string, keywords: string[]): boolean {
  const t = text.toLowerCase();
  return keywords.some((k) => t.includes(k));
}

/** Очистка подписи размера: "39 размер" → "39", "40 розмір" → "40". */
function cleanSizeLabel(raw: string): string {
  return raw
    .replace(/размер\w*/gi, '')
    .replace(/розмір\w*/gi, '')
    .trim();
}

function detectColumns(grid: Cell[][]): ColumnMap {
  // Строка заголовков — первая (в пределах 8) со словами «код» и «назва».
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(grid.length, 8); i++) {
    const row = grid[i];
    const hasCode = row.some((c) => matchesAny(c.text, COLUMN_KEYWORDS.code));
    const hasName = row.some((c) => matchesAny(c.text, COLUMN_KEYWORDS.name));
    if (hasCode && hasName) {
      headerRowIndex = i;
      break;
    }
  }
  if (headerRowIndex === -1) headerRowIndex = 2;

  const header = grid[headerRowIndex] || [];
  const sub = grid[headerRowIndex + 1] || [];
  const find = (kw: string[]) => header.findIndex((c) => matchesAny(c.text, kw));

  const photo = find(COLUMN_KEYWORDS.photo);
  const code = find(COLUMN_KEYWORDS.code);
  const name = find(COLUMN_KEYWORDS.name);
  const country = find(COLUMN_KEYWORDS.country);
  const notes = find(COLUMN_KEYWORDS.notes);
  const material = find(COLUMN_KEYWORDS.material);
  const media = find(COLUMN_KEYWORDS.media);
  const quantity = find(COLUMN_KEYWORDS.quantity);
  const sizeGridStart = find(COLUMN_KEYWORDS.sizeGrid);
  const sizesBlockStart = header.findIndex(
    (c) => matchesAny(c.text, COLUMN_KEYWORDS.sizesBlock), // «Розміри …»
  );

  // Цена: сначала «дроп», иначе «ціна» без «розпродаж».
  let price = header.findIndex((c) => matchesAny(c.text, COLUMN_KEYWORDS.priceDrop));
  if (price === -1) {
    price = header.findIndex(
      (c) =>
        matchesAny(c.text, COLUMN_KEYWORDS.priceAny) &&
        !matchesAny(c.text, COLUMN_KEYWORDS.priceExclude),
    );
  }

  // Одиночная колонка размера (экипировка): «Розмір», но не «Розміри»/«Розмірна».
  const gearSize = header.findIndex((c) => {
    const t = c.text.toLowerCase();
    return matchesAny(c.text, COLUMN_KEYWORDS.sizeSingle) && !t.includes('розміри') && !t.includes('розмірна');
  });

  // Границы для разворачивания объединённых блоков.
  const anchors = [photo, code, name, country, price, notes, material, media, quantity, sizeGridStart, gearSize]
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  const nextAnchorAfter = (start: number, hardStop: number): number => {
    const found = anchors.find((a) => a > start);
    return Math.min(found ?? hardStop, hardStop);
  };
  const maxCol = header.length;

  // Посетевые размеры (обувь): от блока «Розміри» до цены, подписи из строки ниже.
  const sizeCols: { index: number; label: string }[] = [];
  if (sizesBlockStart >= 0 && price > sizesBlockStart) {
    for (let idx = sizesBlockStart; idx < price; idx++) {
      const label = cleanSizeLabel(sub[idx]?.text || header[idx]?.text || '');
      if (label) sizeCols.push({ index: idx, label });
    }
  }

  // Размерная сітка (обувь): блок от заголовка до следующего именованного столбца.
  const sizeGrid: number[] = [];
  if (sizeGridStart >= 0) {
    const stop = nextAnchorAfter(sizeGridStart, maxCol);
    for (let idx = sizeGridStart; idx < stop; idx++) sizeGrid.push(idx);
  }

  return {
    photo: photo >= 0 ? photo : 0,
    code: code >= 0 ? code : 1,
    name: name >= 0 ? name : 2,
    country,
    price: price >= 0 ? price : 11,
    notes,
    material,
    media,
    sizeGrid,
    sizeCols,
    gearSize,
    quantity,
    headerRowIndex,
  };
}

// ---------------------------------------------------------------------------
// Утилиты
// ---------------------------------------------------------------------------

/** Достаёт число из строки цены "1 950 грн." → 1950 (учитывает пробелы/nbsp). */
export function parsePrice(cell: Cell): number {
  if (cell.num !== null && cell.num > 0) return cell.num;
  const digits = cell.text.replace(/[^\d.,]/g, '').replace(/\s| /g, '').replace(',', '.');
  const n = parseFloat(digits);
  return Number.isFinite(n) ? n : 0;
}

function parseQty(cell: Cell): number {
  if (cell.num !== null) return Math.max(0, Math.round(cell.num));
  const n = parseInt(cell.text.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Чистит примечание от внутренних пометок поставщика — минимальной РРЦ/МРЦ
 * (рекомендованная розничная цена), которую нельзя показывать покупателю.
 * Напр. «Мінімальна РРЦ 226 грн Тривалість дії…» → «Тривалість дії…».
 */
function stripSupplierNotes(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    // «(Мінімальна/Минимальная/мін./мин.) РРЦ/МРЦ [:-] 226 (грн)»
    .replace(/(?:(?:мінімальн|минимальн|мін|мин)\p{L}*\.?\s*)?(?:ррц|мрц)\s*[:\-–]?\s*\d[\d\s.,]*\s*(?:грн\.?)?/giu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s•·,\-–—]+|[\s•·,\-–—]+$/g, '')
    .trim();
}

function cellAt(row: Cell[], idx: number): Cell {
  if (idx < 0) return { text: '', imageUrl: null, num: null, hyperlink: null };
  return row[idx] ?? { text: '', imageUrl: null, num: null, hyperlink: null };
}

// ---------------------------------------------------------------------------
// Основной парсер
// ---------------------------------------------------------------------------

export function parseSheet(sheet: SheetDef, grid: Cell[][]): Product[] {
  const cols = detectColumns(grid);
  const products: Product[] = [];
  let currentGroup: string | null = null;
  let lastProduct: Product | null = null;
  let counter = 0;

  for (let r = cols.headerRowIndex + 1; r < grid.length; r++) {
    const row = grid[r];
    if (!row || row.every((c) => !c.text && !c.imageUrl && c.num === null)) continue;

    const codeCell = cellAt(row, cols.code);
    const nameCell = cellAt(row, cols.name);
    const priceCell = cellAt(row, cols.price);
    const photoCell = cellAt(row, cols.photo);

    const hasCode = !!codeCell.text;
    const hasName = !!nameCell.text;
    const basePrice = parsePrice(priceCell);

    // Строка-разделитель подкатегории (баннер модели, напр. «Nike Tiempo»): без
    // кода/цены/названия/фото. Текст-метку ищем сначала в колонке A (Фото), а если
    // пусто — в любой «не-данными» колонке (метка может оказаться в Медіа и т.п.
    // из-за объединённых ячеек). Колонки размеров/кол-ва/цены исключаем.
    const dataCols = new Set<number>([
      cols.code,
      cols.name,
      cols.price,
      cols.photo,
      cols.gearSize,
      cols.quantity,
      ...cols.sizeCols.map((c) => c.index),
    ]);
    let separatorText = photoCell.text;
    if (!separatorText) {
      for (let i = 0; i < row.length; i++) {
        if (dataCols.has(i)) continue;
        const t = (row[i]?.text || '').trim();
        if (t) {
          separatorText = t;
          break;
        }
      }
    }
    const isSeparator =
      !!separatorText && !hasCode && !hasName && basePrice === 0 && !photoCell.imageUrl;
    if (isSeparator) {
      currentGroup = separatorText;
      lastProduct = null;
      continue;
    }

    // Строка-продолжение товара на несколько строк (объединённые код/назва/ціна
    // вгорі, а размеры йдут окремими рядками — напр. воротарські рукавиці 6–10).
    if (
      !hasCode &&
      !hasName &&
      basePrice <= 0 &&
      cols.gearSize >= 0 &&
      lastProduct &&
      cellAt(row, cols.gearSize).text
    ) {
      const label = cellAt(row, cols.gearSize).text;
      const qty = cols.quantity >= 0 ? parseQty(cellAt(row, cols.quantity)) : 0;
      lastProduct.sizes.push({ label, qty, inStock: qty > 0 });
      lastProduct.anyInStock = lastProduct.sizes.some((s) => s.inStock);
      continue;
    }

    if (!hasName && !hasCode) continue;
    if (basePrice <= 0) continue;

    // Размеры: посетевые (обувь) или одиночный размер + количество (экипировка).
    let sizes: SizeAvailability[];
    if (cols.sizeCols.length) {
      sizes = cols.sizeCols.map(({ index, label }) => {
        const qty = parseQty(cellAt(row, index));
        return { label, qty, inStock: qty > 0 };
      });
    } else if (cols.gearSize >= 0) {
      const label = cellAt(row, cols.gearSize).text || 'Розмір';
      const qty = cols.quantity >= 0 ? parseQty(cellAt(row, cols.quantity)) : 1;
      sizes = [{ label, qty, inStock: qty > 0 }];
    } else {
      sizes = [];
    }

    // Размерная сетка: собираем текст из колонок и разбиваем по строкам.
    const sizeGrid = cols.sizeGrid
      .flatMap((idx) => cellAt(row, idx).text.split('\n'))
      .map((s) => s.trim())
      .filter(Boolean);

    // Примечания + состав (экипировка). Внутренние пометки поставщика
    // (мин. РРЦ/МРЦ — рекомендованная цена) вырезаем, чтобы не показывать клиенту.
    const noteParts = [cellAt(row, cols.notes).text, cellAt(row, cols.material).text]
      .map((s) => stripSupplierNotes(s))
      .filter(Boolean);
    const notes = noteParts.length ? noteParts.join(' • ') : null;

    const anyInStock = sizes.length ? sizes.some((s) => s.inStock) : true;

    // Ссылка на доп. фото/видео (гиперссылка в ячейке «Медіа»).
    const mediaCell = cellAt(row, cols.media);
    const mediaUrl = mediaCell.hyperlink && /^https?:\/\//.test(mediaCell.hyperlink)
      ? mediaCell.hyperlink
      : null;

    counter += 1;
    const displayName = nameCell.text || `Модель ${codeCell.text}`;
    const product: Product = {
      id: `${sheet.slug}-${codeCell.text || counter}`,
      slug: productSlug(displayName, codeCell.text || String(counter)),
      code: codeCell.text,
      name: displayName,
      country: cellAt(row, cols.country).text,
      finalPrice: computeFinalPrice(basePrice, sheet.kind),
      image: photoCell.imageUrl || null,
      sizes,
      sizeGrid,
      notes,
      group: currentGroup,
      anyInStock,
      mediaUrl,
      _row: r,
      _drop: basePrice,
    };
    products.push(product);
    lastProduct = product;
  }

  return products;
}
