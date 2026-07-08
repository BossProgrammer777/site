// ---------------------------------------------------------------------------
// Парсинг одного листа Google Sheets (grid data из Sheets API v4) в товары.
// Роли колонок определяются по строке заголовков, с запасным вариантом на
// фиксированные индексы A..P, описанные в ТЗ.
// ---------------------------------------------------------------------------

import { COLUMN_KEYWORDS, SheetDef, computeFinalPrice } from './config';
import { Product, SizeAvailability } from './types';

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
  media: number;
  notes: number;
  sizeGrid: number[];
  sizeCols: { index: number; label: string }[];
  headerRowIndex: number;
}

function matchesAny(text: string, keywords: string[]): boolean {
  const t = text.toLowerCase();
  return keywords.some((k) => t.includes(k));
}

/** Индексная раскладка из ТЗ (A=0 … P=15) — запасной вариант. */
const FALLBACK: Omit<ColumnMap, 'headerRowIndex'> = {
  photo: 0,
  code: 1,
  name: 2,
  country: 3,
  price: 11,
  media: 12,
  notes: 15,
  sizeGrid: [13, 14],
  sizeCols: [
    { index: 4, label: '39' },
    { index: 5, label: '40' },
    { index: 6, label: '41' },
    { index: 7, label: '42' },
    { index: 8, label: '43' },
    { index: 9, label: '44' },
    { index: 10, label: '45' },
  ],
};

function detectColumns(grid: Cell[][]): ColumnMap {
  // Ищем строку заголовков среди первых 8 строк: должна содержать «код» и «назва».
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

  if (headerRowIndex === -1) {
    // Не нашли заголовок — используем фиксированную раскладку и считаем,
    // что данные начинаются с 5-й строки (индекс 4).
    return { ...FALLBACK, headerRowIndex: 3 };
  }

  const header = grid[headerRowIndex];
  const find = (kw: string[]): number => header.findIndex((c) => matchesAny(c.text, kw));

  const photo = find(COLUMN_KEYWORDS.photo);
  const code = find(COLUMN_KEYWORDS.code);
  const name = find(COLUMN_KEYWORDS.name);
  const country = find(COLUMN_KEYWORDS.country);
  const price = find(COLUMN_KEYWORDS.price);
  const media = find(COLUMN_KEYWORDS.media);
  const notes = find(COLUMN_KEYWORDS.notes);

  const sizeGrid: number[] = [];
  header.forEach((c, idx) => {
    if (matchesAny(c.text, COLUMN_KEYWORDS.sizeGrid)) sizeGrid.push(idx);
  });

  // Размерные колонки — всё, что между «країна» и «ціна» с непустым заголовком.
  const sizeCols: { index: number; label: string }[] = [];
  if (country >= 0 && price > country) {
    for (let idx = country + 1; idx < price; idx++) {
      const label = header[idx]?.text?.trim();
      if (label) sizeCols.push({ index: idx, label });
    }
  }

  // Если что-то ключевое не нашли — подстрахуемся фиксированной раскладкой.
  return {
    photo: photo >= 0 ? photo : FALLBACK.photo,
    code: code >= 0 ? code : FALLBACK.code,
    name: name >= 0 ? name : FALLBACK.name,
    country: country >= 0 ? country : FALLBACK.country,
    price: price >= 0 ? price : FALLBACK.price,
    media: media >= 0 ? media : FALLBACK.media,
    notes: notes >= 0 ? notes : FALLBACK.notes,
    sizeGrid: sizeGrid.length ? sizeGrid : FALLBACK.sizeGrid,
    sizeCols: sizeCols.length ? sizeCols : FALLBACK.sizeCols,
    headerRowIndex,
  };
}

// ---------------------------------------------------------------------------
// Утилиты
// ---------------------------------------------------------------------------

/** Достаёт число из строки цены "1 950 грн." → 1950 (учитывает пробелы/nbsp). */
export function parsePrice(cell: Cell): number {
  if (cell.num !== null && cell.num > 0) return cell.num;
  const digits = cell.text.replace(/[^\d.,]/g, '').replace(/\s| /g, '').replace(',', '.');
  const n = parseFloat(digits);
  return Number.isFinite(n) ? n : 0;
}

function parseQty(cell: Cell): number {
  if (cell.num !== null) return Math.max(0, Math.round(cell.num));
  const n = parseInt(cell.text.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function cellAt(row: Cell[], idx: number): Cell {
  return row[idx] ?? { text: '', imageUrl: null, num: null, hyperlink: null };
}

// ---------------------------------------------------------------------------
// Основной парсер
// ---------------------------------------------------------------------------

export function parseSheet(sheet: SheetDef, grid: Cell[][]): Product[] {
  const cols = detectColumns(grid);
  const products: Product[] = [];
  let currentGroup: string | null = null;
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

    // Строка-разделитель подкатегории: текст в колонке A (фото), без кода/цены/названия.
    const separatorText = photoCell.text;
    const isSeparator =
      !!separatorText && !hasCode && !hasName && basePrice === 0 && !photoCell.imageUrl;
    if (isSeparator) {
      currentGroup = separatorText;
      continue;
    }

    // Товар: должен иметь хотя бы название и цену (или код).
    if (!hasName && !hasCode) continue;
    if (basePrice <= 0) continue;

    const sizes: SizeAvailability[] = cols.sizeCols.map(({ index, label }) => {
      const qty = parseQty(cellAt(row, index));
      return { label, qty, inStock: qty > 0 };
    });

    const sizeGrid = cols.sizeGrid
      .map((idx) => cellAt(row, idx).text)
      .filter((t) => !!t);

    const notes = cellAt(row, cols.notes).text || null;
    const image = photoCell.imageUrl || null;

    counter += 1;
    products.push({
      id: `${sheet.slug}-${codeCell.text || counter}`,
      code: codeCell.text,
      name: nameCell.text || `Модель ${codeCell.text}`,
      country: cellAt(row, cols.country).text,
      finalPrice: computeFinalPrice(basePrice, sheet.kind),
      image,
      sizes,
      sizeGrid,
      notes,
      group: currentGroup,
      anyInStock: sizes.some((s) => s.inStock),
    });
  }

  return products;
}
