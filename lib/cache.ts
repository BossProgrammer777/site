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
import { Catalog } from './types';

let cache: Catalog | null = null;
let inflight: Promise<Catalog> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

async function loadFresh(): Promise<Catalog> {
  if (!hasAnyCredential()) {
    // Нет ключа Google — работаем на демо-данных, чтобы витрина не ломалась.
    return getDemoCatalog();
  }
  try {
    return await fetchLiveCatalog();
  } catch (err) {
    console.error('[bootsbaza] live fetch failed:', (err as Error).message);
    // Если раньше были живые данные — лучше отдать их, чем сломаться.
    if (cache) return cache;
    return getDemoCatalog();
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
