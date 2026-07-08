// Отправка сообщения о заказе в Telegram. Токен и chat id — из env; если не
// заданы, заказ логируется в консоль (для тестового периода без бота).

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
