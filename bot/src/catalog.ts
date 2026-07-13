// Клиент каталога. Бот НЕ лезет в таблицу и в код сайта — он берёт актуальные
// товары через публичный эндпоинт ${SITE_URL}/api/catalog. Так бот остаётся
// изолированным и переносимым: меняется только SITE_URL.
//
// Ответ /api/catalog уже безопасен для покупателя: НЕТ дроп-цены, только
// finalPrice. Мы кэшируем результат в памяти на короткое время.

import { config } from './config.js';

export interface SizeAvailability {
  label: string;
  qty: number;
  inStock: boolean;
}

export interface Product {
  id: string;
  slug: string;
  code: string;
  name: string;
  country: string;
  finalPrice: number;
  image: string | null;
  sizes: SizeAvailability[];
  group: string | null;
  anyInStock: boolean;
}

interface Section {
  slug: string;
  label: string;
  products: Product[];
}

interface CatalogCache {
  products: Product[];
  bySlug: Map<string, Product>;
  byId: Map<string, Product>;
  fetchedAt: number;
}

const TTL_MS = 60_000;
let cache: CatalogCache | null = null;
let inflight: Promise<CatalogCache> | null = null;

function norm(s: string): string {
  return (s || '').toLowerCase().replace(/ё/g, 'е').replace(/[’'`]/g, '').replace(/\s+/g, ' ').trim();
}

async function load(): Promise<CatalogCache> {
  const res = await fetch(`${config.siteUrl}/api/catalog`, {
    headers: {
      accept: 'application/json',
      // Представляемся обычным браузером — чтобы анти-бот защита хостинга
      // (напр. Vercel WAF) не отдавала 403 на серверный запрос.
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      'accept-language': 'uk,ru;q=0.9,en;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`Каталог недоступен: ${res.status}`);
  const data = (await res.json()) as { sections?: Section[] };
  const products: Product[] = [];
  const bySlug = new Map<string, Product>();
  const byId = new Map<string, Product>();
  for (const s of data.sections || []) {
    for (const p of s.products || []) {
      if (bySlug.has(p.slug)) continue;
      products.push(p);
      bySlug.set(p.slug, p);
      byId.set(p.id, p);
    }
  }
  return { products, bySlug, byId, fetchedAt: Date.now() };
}

/** Возвращает каталог из кэша, при необходимости обновляя его. */
export async function getCatalog(): Promise<CatalogCache> {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) return cache;
  if (inflight) return inflight;
  inflight = load()
    .then((c) => {
      cache = c;
      return c;
    })
    .catch((e) => {
      // Если обновить не удалось, но есть старый кэш — отдаём его.
      if (cache) return cache;
      throw e;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Абсолютная ссылка на страницу товара. */
export function productLink(p: Product): string {
  return `${config.siteUrl}/product/${encodeURIComponent(p.slug)}`;
}

/** Абсолютный URL картинки (Instagram сам её скачивает). */
export function productImage(p: Product): string | null {
  if (!p.image) return null;
  if (p.image.startsWith('http')) return p.image;
  if (p.image.startsWith('/')) return `${config.siteUrl}${p.image}`;
  return null;
}

/** Размеры в наличии — строкой для показа/подсказки. */
export function availableSizes(p: Product): string[] {
  return p.sizes.filter((s) => s.inStock).map((s) => s.label);
}

// Синонимы: клиент пишет по-русски/разговорно, а в каталоге украинские названия.
// Слово запроса совпадает, если в товаре есть ЛЮБАЯ форма из его группы.
const SYNONYMS: string[][] = [
  ['носки', 'носок', 'шкарпетки', 'шкарпетка'],
  ['гетры', 'гетра', 'гетри'],
  ['бутсы', 'бутси', 'бутса'],
  ['сороконожки', 'сороконіжки', 'сороконожка', 'багатошиповки', 'многошиповки', 'копы'],
  ['футзалки', 'футзалка', 'футзалі', 'футзал', 'зальные', 'зальні'],
  ['детская', 'детские', 'детский', 'дитяче', 'дитячі', 'дитячий', 'дитяча', 'ребенку', 'дитині'],
  ['щитки', 'щиток', 'щитка'],
  ['мяч', 'мячи', 'мячик', "м'яч", "м'ячі"],
  ['вратарь', 'вратарские', 'вратарский', 'вратаря', 'воротар', 'воротарів', 'воротарські'],
  ['перчатки', 'перчатка', 'рукавиці', 'рукавички', 'рукавицы'],
  ['термобелье', 'термобельё', 'термобілизна', 'термо'],
  ['сумка', 'сумки', 'сумку'],
].map((g) => g.map(norm));
const SYN_INDEX = new Map<string, number>();
SYNONYMS.forEach((g, i) => g.forEach((t) => SYN_INDEX.set(t, i)));

function wordMatches(hay: string, w: string): boolean {
  const gi = SYN_INDEX.get(w);
  if (gi === undefined) return hay.includes(w);
  return SYNONYMS[gi].some((t) => hay.includes(t));
}

/**
 * Поиск товаров: товар должен содержать все слова запроса (в любом порядке,
 * с учётом синонимов) в названии/подкатегории/коде/стране. Ранжируем совпадения
 * с начала названия и наличие выше. Возвращаем максимум `limit`.
 *
 * `relaxed` — «мягкий» режим для фото-поиска: не требуем совпадения ВСЕХ слов
 * (клиент/модель могут добавить цвет, которого нет в названии — расцветка видна
 * только на картинке). Достаточно совпадения половины слов; ранжируем по числу
 * совпавших. Так мы соберём ВСЕ расцветки модели, а цвет модель выберет глазами.
 */
export async function searchProducts(
  query: string,
  limit = 6,
  opts: { relaxed?: boolean } = {},
): Promise<Product[]> {
  const q = norm(query);
  if (!q) return [];
  const words = q.split(' ').filter(Boolean);
  const { products } = await getCatalog();
  const need = opts.relaxed ? Math.max(1, Math.ceil(words.length / 2)) : words.length;

  const scored: { p: Product; score: number }[] = [];
  for (const p of products) {
    const hay = norm(`${p.name} ${p.group || ''} ${p.code || ''} ${p.country || ''}`);
    const matched = words.filter((w) => wordMatches(hay, w)).length;
    if (matched < need) continue;
    const name = norm(p.name);
    let score = matched * 40; // больше совпавших слов — выше (важно для relaxed)
    if (name.startsWith(q)) score += 100;
    if (name.includes(q)) score += 50;
    if (norm(p.group || '').includes(q)) score += 20;
    if (p.anyInStock) score += 10; // в наличии — выше
    score -= name.length * 0.01;
    scored.push({ p, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.p);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { bySlug } = await getCatalog();
  return bySlug.get(slug) || null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const { byId } = await getCatalog();
  return byId.get(id) || null;
}

/**
 * Дроп-цена (закупка) и см для размера — из закрытого эндпоинта сайта.
 * Дроп наружу клиентам не идёт, только для учёта заказов в приватной таблице.
 */
export async function fetchOrderMeta(
  code: string,
  size: string,
): Promise<{ drop: number | null; cm: number | null }> {
  const key = config.orderMetaKey;
  if (!key || !code) return { drop: null, cm: null };
  try {
    const res = await fetch(
      `${config.siteUrl}/api/order-meta?code=${encodeURIComponent(code)}&size=${encodeURIComponent(size)}`,
      {
        headers: {
          'x-order-key': key,
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
        },
      },
    );
    if (!res.ok) return { drop: null, cm: null };
    const d = (await res.json()) as { drop: number | null; cm: number | null };
    return { drop: d.drop ?? null, cm: d.cm ?? null };
  } catch {
    return { drop: null, cm: null };
  }
}
