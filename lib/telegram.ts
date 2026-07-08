// Отправка сообщения о заказе в Telegram. Токен и chat id — из env; если не
// заданы, заказ логируется в консоль (для тестового периода без бота).

/** Отправка фото товаров альбомом (до 10). Ошибки не критичны. */
export async function sendTelegramPhotos(
  photos: { url: string; caption?: string }[],
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat || photos.length === 0) return;
  const media = photos.slice(0, 10).map((p) => ({
    type: 'photo',
    media: p.url,
    caption: p.caption,
  }));
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, media }),
    });
  } catch {
    /* фото не критичны — текст заказа уже отправлен */
  }
}

export async function sendTelegram(text: string): Promise<{ sent: boolean }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    console.log('[order] Telegram не налаштований. Замовлення:\n' + text);
    return { sent: false };
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { sent: true };
}
