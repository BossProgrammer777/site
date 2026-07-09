// Отправка заказа в Telegram. Токен и chat id — из env; если не заданы, заказ
// логируется в консоль (для тестового периода без бота).

const API = (method: string) =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

function tg(method: string, body: unknown) {
  return fetch(API(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Отправка заказа ОДНИМ сообщением: фото товара(ов) + текст заказа подписью.
 *  - 1 фото → sendPhoto с caption;
 *  - 2+ фото → sendMediaGroup, подпись на первом фото;
 *  - нет фото / подпись >1024 симв. / фото не отправилось → текст сообщением.
 * Фото передаются публичными URL (лучше — прямые ссылки, которые Telegram
 * может забрать сам).
 */
export async function sendTelegramOrder(
  text: string,
  photoUrls: string[] = [],
): Promise<{ sent: boolean }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    console.log('[order] Telegram не налаштований. Замовлення:\n' + text);
    return { sent: false };
  }

  const pics = photoUrls.filter(Boolean).slice(0, 10);

  // Одно сообщение: фото + заказ. Лимит подписи Telegram — 1024 символа.
  if (pics.length && text.length <= 1024) {
    try {
      if (pics.length === 1) {
        const res = await tg('sendPhoto', {
          chat_id: chat,
          photo: pics[0],
          caption: text,
          parse_mode: 'HTML',
        });
        if (res.ok) return { sent: true };
      } else {
        const media = pics.map((url, i) =>
          i === 0
            ? { type: 'photo', media: url, caption: text, parse_mode: 'HTML' }
            : { type: 'photo', media: url },
        );
        const res = await tg('sendMediaGroup', { chat_id: chat, media });
        if (res.ok) return { sent: true };
      }
      // Фото не отправилось (Telegram не смог забрать URL) — падаем на текст.
    } catch {
      /* падаем на текст ниже */
    }
  }

  // Фолбэк: текст отдельным сообщением.
  const res = await tg('sendMessage', {
    chat_id: chat,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${(await res.text()).slice(0, 200)}`);

  // Если подпись не влезла (длинный заказ), но фото есть — отправим альбомом.
  if (pics.length && text.length > 1024) {
    try {
      await tg('sendMediaGroup', {
        chat_id: chat,
        media: pics.map((url) => ({ type: 'photo', media: url })),
      });
    } catch {
      /* фото не критичны */
    }
  }
  return { sent: true };
}

/**
 * Лучшая ссылка на фото для Telegram: прямой URL Google (в обход нашего
 * прокси/домена), либо абсолютный URL на нашем домене для локальных фото.
 */
export function telegramPhotoUrl(image: string | null, base: string): string | null {
  if (!image) return null;
  // Проксированное фото: /api/img?src=<encoded> → берём исходный (прямой) URL.
  const m = image.match(/\/api\/img\?src=([^&]+)/);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return null;
    }
  }
  if (image.startsWith('http')) return image;
  if (image.startsWith('/')) return `${base}${image}`; // /photos/… — нужен публичный домен
  return null;
}
