// ---------------------------------------------------------------------------
// Bootsbaza — центральный конфиг.
// Здесь собраны все настройки, которые обычно нужно менять: наценки,
// правило округления, список листов таблицы и параметры кэширования.
// ---------------------------------------------------------------------------

/** ID Google-таблицы (из URL: /spreadsheets/d/<ID>/edit) */
export const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID || '1JRAYTZNtYiNgJE6lT1DPpG9eeXP2PUxQcqG-0Hyg0JE';

/** Тип товара определяет размер наценки. */
export type ProductKind = 'footwear' | 'gear';

// ---------------------------------------------------------------------------
// НАЦЕНКА И ОКРУГЛЕНИЕ  (меняется в одном месте)
// ---------------------------------------------------------------------------

/**
 * Наценка в долях: 0.15 = +15 %, 0.30 = +30 %.
 * Значения можно переопределить переменными окружения (MARKUP_FOOTWEAR,
 * MARKUP_GEAR) — например в настройках Vercel, не меняя код.
 */
export const MARKUP: Record<ProductKind, number> = {
  footwear: Number(process.env.MARKUP_FOOTWEAR ?? 0.15), // обувь
  gear: Number(process.env.MARKUP_GEAR ?? 0.3), // экипировка
};

/** Кратность округления финальной цены (грн). Цена округляется ВВЕРХ. */
export const PRICE_ROUND_TO = Number(process.env.PRICE_ROUND_TO ?? 10);

/**
 * Финальная цена покупателя: базовая (дроп) цена + наценка,
 * округлённая вверх до ближайшего кратного PRICE_ROUND_TO.
 * Пример: 1950 * 1.15 = 2242.5 → 2250.
 */
export function computeFinalPrice(basePrice: number, kind: ProductKind): number {
  if (!basePrice || basePrice <= 0) return 0;
  const withMarkup = basePrice * (1 + MARKUP[kind]);
  return Math.ceil(withMarkup / PRICE_ROUND_TO) * PRICE_ROUND_TO;
}

// ---------------------------------------------------------------------------
// ЛИСТЫ ТАБЛИЦЫ  →  РАЗДЕЛЫ САЙТА
// title  — точное название вкладки в Google Sheets (для A1-нотации API).
// slug   — путь/идентификатор раздела на сайте.
// label  — человекопонятное название в навигации.
// kind   — тип товара (задаёт наценку).
// ---------------------------------------------------------------------------

export interface SheetDef {
  title: string;
  slug: string;
  label: string;
  kind: ProductKind;
}

export const SHEETS: SheetDef[] = [
  { title: 'БУТСИ', slug: 'butsy', label: 'Бутси', kind: 'footwear' },
  { title: 'СОРОКОНІЖКИ', slug: 'sorokonizhky', label: 'Сороконіжки', kind: 'footwear' },
  { title: 'ФУТЗАЛКИ', slug: 'futzalky', label: 'Футзалки', kind: 'footwear' },
  { title: 'ДИТЯЧЕ ВЗУТТЯ', slug: 'dytiache-vzuttia', label: 'Дитяче взуття', kind: 'footwear' },
  { title: 'ЕКІПІРУВАННЯ', slug: 'ekipiruvannia', label: 'Екіпірування', kind: 'gear' },
  { title: 'НБ ВЗУТТЯ', slug: 'nb-vzuttia', label: 'Взуття без бренду', kind: 'footwear' },
  { title: 'НБ ДИТЯЧЕ ВЗУТТЯ', slug: 'nb-dytiache-vzuttia', label: 'Дитяче без бренду', kind: 'footwear' },
  { title: 'НБ ЕКІПІРУВАННЯ', slug: 'nb-ekipiruvannia', label: 'Екіпірування без бренду', kind: 'gear' },
];

export function sheetBySlug(slug: string): SheetDef | undefined {
  return SHEETS.find((s) => s.slug === slug);
}

// ---------------------------------------------------------------------------
// КЭШИРОВАНИЕ / ФОНОВОЕ ОБНОВЛЕНИЕ
// ---------------------------------------------------------------------------

/** Сколько секунд кэш считается «свежим». По истечении — фоновое обновление. */
export const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 300); // 5 мин

/** Жёсткий предел: старше этого срока — обновляем синхронно (блокируя запрос). */
export const CACHE_HARD_TTL_SECONDS = Number(
  process.env.CACHE_HARD_TTL_SECONDS || 60 * 60, // 1 час
);

// ---------------------------------------------------------------------------
// ПАРСИНГ ЛИСТА
// Роли колонок определяются автоматически по заголовкам (см. lib/parse.ts),
// но эти ключевые слова задают соответствие. Размерные колонки — всё, что
// между «країна» и «ціна».
// ---------------------------------------------------------------------------

export const COLUMN_KEYWORDS = {
  photo: ['фото'],
  code: ['код'],
  name: ['назва', 'модель'],
  country: ['країна', 'страна'],
  // Базовая (дроп) цена. Приоритет у «дроп», чтобы не спутать с «Ціна розпродаж».
  priceDrop: ['дроп'],
  priceAny: ['ціна', 'цена'],
  priceExclude: ['розпродаж', 'распродаж'],
  media: ['медіа', 'медиа'],
  sizeGrid: ['розмірна сітка', 'сітка', 'сетка'],
  notes: ['примітк', 'примеч'],
  // Блок посетевых размеров (обувь): «Розміри в наявності».
  sizesBlock: ['розміри'],
  // Одиночная колонка размера (экипировка): «Розмір».
  sizeSingle: ['розмір'],
  // Количество (экипировка): «Кількість».
  quantity: ['кількість', 'количество'],
  // Состав/материал (экипировка): «Склад».
  material: ['склад'],
};
