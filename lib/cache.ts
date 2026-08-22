// ---------------------------------------------------------------------------
// Кэш каталога в памяти процесса с фоновым обновлением.
//  - «свежий» (< CACHE_TTL)          → отдаём как есть;
//  - «устарел» (TTL..HARD_TTL)       → отдаём старое, обновляем в фоне (SWR);
//  - «протух» (> HARD_TTL) или пусто → обновляем синхронно.
// Таймер тоже периодически обновляет кэш, чтобы данные подтягивались без
// участия пользователя (см. ensureBackgroundRefresh).
// ---------------------------------------------------------------------------

import { CACHE_TTL_SECONDS, CACHE_HARD_TTL_SECONDS } from './config';
import { hasAnyCredential } from './googleAuth';
import { fetchLiveCatalog } from './sheets';
import { getDemoCatalog } from './demoData';
import { fetchCrmProducts } from './crmFeed';
import { Catalog } from './types';

// Подмешивает товары из CRM (помеченные «выгрузить на сайт») в разделы каталога.
// Slug каждого CRM-товара делаем уникальным относительно уже собранных.
async function mergeCrmProducts(catalog: Catalog): Promise<Catalog> {
  try {
    const crm = await fetchCrmProducts();
    if (!crm.length) return catalog;

    const seen = new Set<string>();
    for (const s of catalog.sections) for (const p of s.products) seen.add(p.slug);

    const bySection = new Map(catalog.sections.map((s) => [s.slug, s]));
    for (const { section, product } of crm) {
      const target = bySection.get(section);
      if (!target) continue; // раздела нет на сайте — пропускаем
      let slug = product.slug, n = 2;
      while (seen.has(slug)) slug = `${product.slug}-${n++}`;
      seen.add(slug);
      product.slug = slug;
      target.products.push(product);
      if (product.country && !target.countries.includes(product.country)) {
        target.countries.push(product.country);
      }
    }
  } catch {
    /* фид не должен ломать каталог */
  }
  return catalog;
}

let cache: Catalog | null = null;
let inflight: Promise<Catalog> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

async function loadFresh(): Promise<Catalog> {
  if (!hasAnyCredential()) {
    // Нет ключа Google — работаем на демо-данных, чтобы витрина не ломалась.
    return mergeCrmProducts(getDemoCatalog());
  }
  try {
    const live = await fetchLiveCatalog();
    return await mergeCrmProducts(live);
  } catch (err) {
    console.error('[bootsbaza] live fetch failed:', (err as Error).message);
    // Если раньше были живые данные — лучше отдать их, чем сломаться.
    if (cache) return cache;
    return mergeCrmProducts(getDemoCatalog());
  }
}

function refresh(): Promise<Catalog> {
  if (inflight) return inflight;
  inflight = loadFresh()
    .then((data) => {
      cache = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Запускает периодическое фоновое обновление (идемпотентно). */
export function ensureBackgroundRefresh(): void {
  if (timer) return;
  timer = setInterval(() => {
    refresh().catch(() => {});
  }, CACHE_TTL_SECONDS * 1000);
  // Не держим процесс из-за таймера.
  if (typeof timer.unref === 'function') timer.unref();
}

export async function getCatalog(): Promise<Catalog> {
  ensureBackgroundRefresh();
  const now = Date.now();

  if (!cache) return refresh();

  const ageSec = (now - cache.fetchedAt) / 1000;
  if (ageSec < CACHE_TTL_SECONDS) return cache; // свежий
  if (ageSec < CACHE_HARD_TTL_SECONDS) {
    refresh().catch(() => {}); // stale-while-revalidate
    return cache;
  }
  return refresh(); // протух — ждём обновления
}

export async function forceRefresh(): Promise<Catalog> {
  cache = null;
  return refresh();
}
