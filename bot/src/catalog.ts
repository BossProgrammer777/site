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
    headers: { accept: 'application/json' },
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

/**
 * Поиск товаров: товар должен содержать все слова запроса (в любом порядке)
 * в названии/подкатегории/коде/стране. Ранжируем совпадения с начала названия
 * и наличие выше. Возвращаем максимум `limit`.
 */
export async function searchProducts(query: string, limit = 6): Promise<Product[]> {
  const q = norm(query);
  if (!q) return [];
  const words = q.split(' ').filter(Boolean);
  const { products } = await getCatalog();

  const scored: { p: Product; score: number }[] = [];
  for (const p of products) {
    const hay = norm(`${p.name} ${p.group || ''} ${p.code || ''} ${p.country || ''}`);
    if (!words.every((w) => hay.includes(w))) continue;
    const name = norm(p.name);
    let score = 0;
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
