// Автообновление токена Instagram. Долгоживущий токен (IGAA…) действует ~60 дней
// и его можно продлевать. Держим актуальный токен в памяти и раз в 12 часов
// продлеваем его ещё на ~60 дней — пока бот работает, токен не протухнет.
//
// Важно: env-переменная IG_ACCESS_TOKEN — это «семя» (стартовое значение).
// Обновлённый токен живёт в памяти процесса. Пока бот запущен (а он у нас 24/7),
// токен постоянно свежий.

import { config } from './config.js';

let current = config.instagram.accessToken;

/** Актуальный токен (используется везде вместо config.instagram.accessToken). */
export function getAccessToken(): string {
  return current;
}

// Хост Graph без версии: refresh_access_token живёт на graph.instagram.com без /vXX.
const refreshHost = config.instagram.graphBase.replace(/\/v\d+\.\d+$/, '');

/** Продлевает токен ещё на ~60 дней. Возвращает результат для логов. */
export async function refreshAccessToken(): Promise<{ ok: boolean; info: string }> {
  const url = `${refreshHost}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(
    current,
  )}`;
  try {
    const res = await fetch(url);
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (res.ok && data.access_token) {
      current = data.access_token;
      const days = data.expires_in ? Math.round(data.expires_in / 86400) : '?';
      return { ok: true, info: `токен продлён, действует ещё ~${days} дн.` };
    }
    // Свежий токен (<24ч) Meta продлевать не даёт — это нормально, продлим позже.
    return { ok: false, info: JSON.stringify(data).slice(0, 200) };
  } catch (e) {
    return { ok: false, info: (e as Error).message };
  }
}

/** Запускает периодическое продление токена (сразу и далее каждые 12 часов). */
export function startTokenRefresh(): void {
  const tick = () =>
    refreshAccessToken().then((r) => console.log(`[ig-token] ${r.ok ? '✓' : 'пропуск'}: ${r.info}`));
  tick();
  setInterval(tick, 12 * 60 * 60 * 1000);
}
