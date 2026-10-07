// ---------------------------------------------------------------------------
// Кэш каталога в памяти процесса с фоновым обновлением.
//  - «свежий» (< CACHE_TTL)          → отдаём как есть;
//  - «устарел» (TTL..HARD_TTL)       → отдаём старое, обновляем в фоне (SWR);
//  - «протух» (> HARD_TTL) или пусто → обновляем синхронно.
// Таймер тоже периодически обновляет кэш, чтобы данные подтягивались без
// участия пользователя (см. ensureBackgroundRefresh).
// ---------------------------------------------------------------------------

import { CACHE_TTL_SECONDS, CACHE_HARD_TTL_SECONDS, MIN_SITE_QTY } from './config';
import { hasAnyCredential } from './googleAuth';
import { fetchLiveCatalog } from './sheets';
import { getDemoCatalog } from './demoData';
import { fetchCrmProducts } from './crmFeed';
import { Catalog } from './types';
import { indexNowSubmit, bothLocales } from './indexnow';
import { alertCatalogChanges, alertCatalogFetchFailed } from './catalogAlerts';

// Сообщаем Bing (IndexNow) о товарах, которые появились, исчезли или сменили
// наличие с прошлого обновления прайса. Только live→live (не демо, не первый
// запуск инстанса). Защита: если «пропала» заметная часть каталога или изменений
// слишком много — это скорее сбой чтения прайса, ничего не отправляем.
function notifyCatalogChanges(prev: Catalog | null, next: Catalog): void {
  if (!prev || prev === next || prev.source !== 'live' || next.source !== 'live') return;
  const avail = (c: Catalog) => {
    const m = new Map<string, boolean>();
    for (const s of c.sections)
      for (const p of s.products) m.set(p.slug, p.sizes.some((z) => z.qty >= MIN_SITE_QTY));
    return m;
  };
  const before = avail(prev);
  const after = avail(next);
  if (before.size < 20) return;

  const changed: string[] = [];
  let removed = 0;
  for (const [slug, ok] of after) if (!before.has(slug) || before.get(slug) !== ok) changed.push(slug);
  for (const slug of before.keys())
    if (!after.has(slug)) {
      removed++;
      changed.push(slug);
    }
  if (!changed.length) return;
  if (removed > before.size * 0.3 || changed.length > 500) {
    console.warn(`[indexnow] пропущено: подозрительно много изменений (${changed.length}, удалено ${removed})`);
    return;
  }
  const paths = changed.flatMap((slug) => bothLocales(`/product/${encodeURIComponent(slug)}`));
  void indexNowSubmit(paths, `каталог: ${changed.length} товар(ов) изменилось`);
}

// Правило ВИТРИНЫ: размер доступен только при остатке ≥ MIN_SITE_QTY (по умолч. 2).
// Размеры с остатком 1 не показываем; товар без доступных размеров скрываем.
// Не мутирует исходный кэш (crm-catalog должен видеть реальные остатки, включая 1).
function withMinStock(catalog: Catalog): Catalog {
  const MIN = MIN_SITE_QTY;
  const sections = catalog.sections.map((section) => {
    const products = section.products
      .map((p) => {
        const sizes = p.sizes.map((s) => ({ ...s, inStock: s.qty >= MIN }));
        return { ...p, sizes, anyInStock: sizes.some((s) => s.inStock) };
      })
      .filter((p) => p.anyInStock);
    const countries = Array.from(new Set(products.map((p) => p.country).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'uk'));
    return { ...section, products, countries };
  });
  return { ...catalog, sections };
}

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
    void alertCatalogFetchFailed((err as Error).message).catch(() => {});
    // Если раньше были живые данные — лучше отдать их, чем сломаться.
    if (cache) return cache;
    return mergeCrmProducts(getDemoCatalog());
  }
}

function refresh(): Promise<Catalog> {
  if (inflight) return inflight;
  const prev = cache;
  inflight = loadFresh()
    .then((data) => {
      try {
        notifyCatalogChanges(prev, data);
      } catch {
        /* IndexNow не должен влиять на каталог */
      }
      // Telegram: новые проблемы прайса (бренды, переименования, дубли кодов…).
      void alertCatalogChanges(prev, data).catch(() => {});
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

// Каталог ДЛЯ ВИТРИНЫ: как getCatalog, но с правилом «показывать размер только при
// остатке ≥ MIN_SITE_QTY». Используется на всех публичных страницах и в приёме заказов.
// getCatalog() остаётся «сырым» (реальные остатки) — для фида сайт→CRM.
export async function getPublicCatalog(): Promise<Catalog> {
  return withMinStock(await getCatalog());
}
