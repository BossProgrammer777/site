// ---------------------------------------------------------------------------
// Оповещения в Telegram о проблемах прайса (группа заказов).
//  - сразу при обновлении прайса: только НОВЫЕ проблемы и резкие изменения;
//  - ошибка чтения прайса: не чаще раза в 6 часов.
// Повторы гасим в памяти процесса (12 ч на один и тот же ключ). Ежедневный
// отчёт — отдельно (app/api/catalog-health), он ловит то, что пропущено при
// перезапуске сервера.
// ---------------------------------------------------------------------------

import type { Catalog } from './types';
import { catalogDiff, catalogHealth, healthMessage, healthFullText, type HealthIssue } from './catalogHealth';
import { sendTelegramText, sendTelegramDocument } from './telegram';

const REPEAT_MS = 12 * 60 * 60 * 1000;

/** Сообщение + (если строк больше, чем помещается) файл с полными списками. */
export async function sendHealthReport(title: string, issues: HealthIssue[]): Promise<boolean> {
  const { sent } = await sendTelegramText(healthMessage(title, issues));
  const full = healthFullText(title, issues);
  if (full) {
    const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' });
    await sendTelegramDocument(`perevirka-praisu-${day}.txt`, full, 'Повний список');
  }
  return sent;
}
const sentAt = new Map<string, number>();

function fresh(issues: HealthIssue[], windowMs = REPEAT_MS): HealthIssue[] {
  const now = Date.now();
  return issues.filter((i) => {
    const last = sentAt.get(i.key);
    if (last && now - last < windowMs) return false;
    sentAt.set(i.key, now);
    return true;
  });
}

/** Сравнить прайс с предыдущим чтением и сообщить о новых проблемах. */
export async function alertCatalogChanges(prev: Catalog | null, next: Catalog): Promise<void> {
  if (!prev || prev.source !== 'live' || next.source !== 'live') return;
  const was = new Set(catalogHealth(prev).map((i) => i.key));
  const issues = [
    ...catalogDiff(prev, next),
    ...catalogHealth(next).filter((i) => !was.has(i.key)), // только появившиеся
  ];
  const toSend = fresh(issues);
  if (!toSend.length) return;
  await sendHealthReport('⚠️ Прайс змінився — це впливає на сайт', toSend);
}

/** Не удалось прочитать прайс (сайт работает на старой копии). */
export async function alertCatalogFetchFailed(message: string): Promise<void> {
  const toSend = fresh(
    [{ key: 'fetch-failed', level: 'critical', text: `🔴 <b>Не вдалося прочитати прайс</b>\nСайт працює на останній збереженій копії.\nПомилка: ${message.slice(0, 300).replace(/</g, '&lt;')}` }],
    6 * 60 * 60 * 1000,
  );
  if (toSend.length) await sendTelegramText(healthMessage('⚠️ Проблема з прайсом', toSend));
}
