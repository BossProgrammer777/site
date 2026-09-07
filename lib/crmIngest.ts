import { sendTelegramOrder } from './telegram';

// Пересылка заказа в CRM (/api/ingest/order). В отличие от прежнего варианта —
// НЕ глушит ошибки молча: если не настроены env, не совпал токен, CRM вернула
// не-2xx или сеть упала — шлёт предупреждение в тот же Telegram, чтобы менеджер
// одразу побачив, що замовлення НЕ потрапило в CRM (і додав вручну).
export async function forwardOrderToCrm(payload: unknown, context = ''): Promise<void> {
  const url = process.env.CRM_INGEST_URL;
  const token = process.env.CRM_SYNC_TOKEN;
  const ctx = context ? ` (${context})` : '';

  if (!url || !token) {
    await alert(
      `⚠️ <b>Замовлення НЕ передано в CRM</b>${ctx}\n` +
        `Причина: на сайті не налаштовано CRM_INGEST_URL / CRM_SYNC_TOKEN.`,
    );
    return;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-crm-token': token },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 200);
      await alert(
        `⚠️ <b>Замовлення НЕ долетіло в CRM</b>${ctx}\n` +
          `HTTP ${res.status}. ${detail}`,
      );
    }
  } catch (e) {
    await alert(`⚠️ <b>Замовлення НЕ долетіло в CRM</b>${ctx}\n${(e as Error).message}`);
  }
}

async function alert(msg: string) {
  try {
    await sendTelegramOrder(msg, []);
  } catch {
    /* алерт не критичен */
  }
}
