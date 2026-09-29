// ---------------------------------------------------------------------------
// IndexNow: мгновенно сообщаем Bing об изменившихся страницах (новый товар,
// товар закончился/вернулся, обновлённая статья) — они попадают в поиск за
// часы, а не дни. Ключ подтверждается файлом /public/<KEY>.txt.
//
// Безопасность: работает ТОЛЬКО в продакшене, ничего не бросает наружу,
// ограничен таймаутом — если Bing недоступен, сайт этого не заметит.
// ---------------------------------------------------------------------------

import { siteUrl } from './site';

export const INDEXNOW_KEY = 'dcec0d1504be930a44d7f1394602e850';
const ENDPOINT = 'https://www.bing.com/indexnow';
const MAX_PER_REQUEST = 10000; // лимит протокола

/** Отправляет пути сайта (напр. '/product/x', '/ru/blog/y') в IndexNow. */
export async function indexNowSubmit(paths: string[], reason: string): Promise<void> {
  // Превью-деплои и локальная разработка ничего не отправляют.
  if (process.env.VERCEL_ENV !== 'production') return;
  const base = siteUrl();
  if (!/^https:\/\//.test(base) || base.includes('vercel.app')) return;

  const urls = Array.from(new Set(paths.map((p) => `${base}${p === '/' ? '/' : p}`)));
  if (!urls.length) return;
  const host = new URL(base).host;

  for (let i = 0; i < urls.length; i += MAX_PER_REQUEST) {
    const urlList = urls.slice(i, i + MAX_PER_REQUEST);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${base}/${INDEXNOW_KEY}.txt`, urlList }),
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      });
      console.log(`[indexnow] ${reason}: ${urlList.length} URL → ${res.status}`);
    } catch (e) {
      console.error(`[indexnow] ${reason}: не отправлено — ${(e as Error).message}`);
    }
  }
}

/** UA-путь + его RU-версия (обе языковые версии страницы). */
export function bothLocales(path: string): string[] {
  const clean = path === '/' ? '' : path;
  return [clean || '/', `/ru${clean}`];
}
