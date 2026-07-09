// Отправка заказа в Telegram. Токен и chat id — из env; если не заданы, заказ
// логируется в консоль (для тестового периода без бота).
//
// Фото отправляем БАЙТАМИ (сервер сам скачивает картинку и грузит в Telegram),
// а не ссылкой — так Telegram не зависит от доступности нашего домена, а мы
// проверяем, что скачали именно изображение, а не HTML-заглушку.

const API = (method: string) =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

interface Pic {
  data: ArrayBuffer;
  type: string;
}

/** Скачивает картинку сервером. Возвращает null, если это не изображение. */
async function fetchImage(url: string): Promise<Pic | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return null; // HTML/заглушка — пропускаем
    const data = await res.arrayBuffer();
    if (data.byteLength < 100) return null;
    return { data, type };
  } catch {
    return null;
  }
}

function ext(type: string): string {
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  return 'jpg';
}

/**
 * Заказ ОДНИМ сообщением: фото товара(ов) + текст заказа подписью.
 *  - 1 фото → sendPhoto (байты) с caption;
 *  - 2+ фото → sendMediaGroup (байты), подпись на первом;
 *  - нет фото / подпись >1024 / фото не скачалось → текст сообщением.
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

  // Скачиваем картинки сервером (до 10).
  const pics = (
    await Promise.all(photoUrls.filter(Boolean).slice(0, 10).map(fetchImage))
  ).filter((p): p is Pic => !!p);

  const captionFits = text.length <= 1024;

  if (pics.length && captionFits) {
    try {
      if (pics.length === 1) {
        const fd = new FormData();
        fd.append('chat_id', chat);
        fd.append('caption', text);
        fd.append('parse_mode', 'HTML');
        fd.append('photo', new Blob([pics[0].data], { type: pics[0].type }), `photo.${ext(pics[0].type)}`);
        const res = await fetch(API('sendPhoto'), { method: 'POST', body: fd });
        if (res.ok) return { sent: true };
      } else {
        const fd = new FormData();
        fd.append('chat_id', chat);
        const media = pics.map((p, i) =>
          i === 0
            ? { type: 'photo', media: `attach://p${i}`, caption: text, parse_mode: 'HTML' }
            : { type: 'photo', media: `attach://p${i}` },
        );
        fd.append('media', JSON.stringify(media));
        pics.forEach((p, i) =>
          fd.append(`p${i}`, new Blob([p.data], { type: p.type }), `p${i}.${ext(p.type)}`),
        );
        const res = await fetch(API('sendMediaGroup'), { method: 'POST', body: fd });
        if (res.ok) return { sent: true };
      }
    } catch {
      /* падаем на текст ниже */
    }
  }

  // Фолбэк: текст сообщением.
  const res = await fetch(API('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${(await res.text()).slice(0, 200)}`);

  // Длинный заказ (подпись не влезла), но фото есть — отдельным альбомом.
  if (pics.length && !captionFits) {
    try {
      const fd = new FormData();
      fd.append('chat_id', chat);
      fd.append('media', JSON.stringify(pics.map((p, i) => ({ type: 'photo', media: `attach://p${i}` }))));
      pics.forEach((p, i) =>
        fd.append(`p${i}`, new Blob([p.data], { type: p.type }), `p${i}.${ext(p.type)}`),
      );
      await fetch(API('sendMediaGroup'), { method: 'POST', body: fd });
    } catch {
      /* фото не критичны */
    }
  }
  return { sent: true };
}

/**
 * URL картинки для скачивания сервером: прямой URL Google (из /api/img?src=…),
 * либо абсолютный URL на нашем домене для локальных фото.
 */
export function telegramPhotoUrl(image: string | null, base: string): string | null {
  if (!image) return null;
  const m = image.match(/\/api\/img\?src=([^&]+)/);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return null;
    }
  }
  if (image.startsWith('http')) return image;
  if (image.startsWith('/')) return `${base}${image}`;
  return null;
}
