// Уведомления в Telegram-группу менеджеров: заказы из Директа и запросы
// «позвать живого менеджера». Свой собственный модуль (не зависит от кода
// сайта) — чтобы бот легко переносился в отдельный репозиторий.

import { config } from './config.js';

const api = (method: string) =>
  `https://api.telegram.org/bot${config.telegram.token}/${method}`;

export const escapeHtml = (s: string) =>
  (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Скачивает картинку и грузит её байтами (не ссылкой) — надёжнее для Telegram. */
async function fetchImage(url: string): Promise<{ data: ArrayBuffer; type: string } | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return null;
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
 * Отправляет сообщение в группу. Если передан photoUrl и подпись влезает —
 * отправляет фото товара с подписью одним сообщением; иначе — просто текст.
 */
export async function notifyGroup(text: string, photoUrl?: string | null): Promise<void> {
  const chat = config.telegram.chatId;

  if (photoUrl && text.length <= 1024) {
    const pic = await fetchImage(photoUrl);
    if (pic) {
      try {
        const fd = new FormData();
        fd.append('chat_id', chat);
        fd.append('caption', text);
        fd.append('parse_mode', 'HTML');
        fd.append('photo', new Blob([pic.data], { type: pic.type }), `photo.${ext(pic.type)}`);
        const res = await fetch(api('sendPhoto'), { method: 'POST', body: fd });
        if (res.ok) return;
      } catch {
        /* падаем на текст ниже */
      }
    }
  }

  const res = await fetch(api('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    }),
  });
  if (!res.ok) {
    console.error('[telegram] ошибка отправки:', res.status, (await res.text()).slice(0, 200));
  }
}
