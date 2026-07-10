// Instagram Send API + разбор вебхуков. Изолированный слой: если завтра
// подключим другой канал (например, отдельный сервис), меняется только этот файл.

import crypto from 'node:crypto';
import { config } from './config.js';
import { getAccessToken } from './igToken.js';

const sendUrl = () =>
  `${config.instagram.graphBase}/me/messages?access_token=${encodeURIComponent(
    getAccessToken(),
  )}`;

/**
 * Подписывает приложение на вебхук-поле "messages" для подключённого аккаунта
 * (аналог тумблера «Подписка на Webhooks» в панели Meta, только через API —
 * панель бывает глючит). Вызываем на старте и через GET /setup.
 */
export async function subscribeToMessages(): Promise<{ ok: boolean; status: number; body: string }> {
  const url = `${config.instagram.graphBase}/me/subscribed_apps?subscribed_fields=messages&access_token=${encodeURIComponent(
    getAccessToken(),
  )}`;
  try {
    const res = await fetch(url, { method: 'POST' });
    const body = (await res.text()).slice(0, 400);
    return { ok: res.ok, status: res.status, body };
  } catch (e) {
    return { ok: false, status: 0, body: (e as Error).message };
  }
}

async function send(body: unknown): Promise<void> {
  try {
    const res = await fetch(sendUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('[instagram] send error:', res.status, (await res.text()).slice(0, 300));
    }
  } catch (e) {
    console.error('[instagram] send failed:', (e as Error).message);
  }
}

// Instagram ограничивает длину текста ~1000 символов. Режем по границам абзацев.
function chunk(text: string, size = 950): string[] {
  if (text.length <= size) return [text];
  const parts: string[] = [];
  let rest = text;
  while (rest.length > size) {
    let cut = rest.lastIndexOf('\n', size);
    if (cut < size * 0.5) cut = rest.lastIndexOf(' ', size);
    if (cut < size * 0.5) cut = size;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

export async function sendText(recipientId: string, text: string): Promise<void> {
  for (const part of chunk(text)) {
    await send({ recipient: { id: recipientId }, message: { text: part } });
  }
}

export async function sendImage(recipientId: string, url: string): Promise<void> {
  await send({
    recipient: { id: recipientId },
    message: { attachment: { type: 'image', payload: { url, is_reusable: true } } },
  });
}

export async function markSeen(recipientId: string): Promise<void> {
  await send({ recipient: { id: recipientId }, sender_action: 'mark_seen' });
}

export async function typingOn(recipientId: string): Promise<void> {
  await send({ recipient: { id: recipientId }, sender_action: 'typing_on' });
}

/** Проверка подписи X-Hub-Signature-256 (если задан META_APP_SECRET). */
export function verifySignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  const secret = config.instagram.appSecret;
  if (!secret) return true; // проверка отключена
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = signatureHeader.slice('sha256='.length);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(provided, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// --- Разбор входящих событий -------------------------------------------------

export interface IncomingMessage {
  senderId: string;
  text: string;
}

interface WebhookMessaging {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: { text?: string; is_echo?: boolean; is_deleted?: boolean; attachments?: unknown[] };
}

/**
 * Достаёт из тела вебхука текстовые сообщения от клиентов (не эхо, не удаления).
 * Поддерживает объекты `instagram` и `page` (Messenger-совместимый формат).
 */
export function parseIncoming(body: unknown): IncomingMessage[] {
  const out: IncomingMessage[] = [];
  const b = body as { entry?: { messaging?: WebhookMessaging[] }[] };
  for (const entry of b.entry || []) {
    for (const m of entry.messaging || []) {
      const msg = m.message;
      if (!msg || msg.is_echo || msg.is_deleted) continue;
      const senderId = m.sender?.id;
      const text = (msg.text || '').trim();
      if (!senderId || !text) continue; // вложения без текста пока пропускаем
      out.push({ senderId, text });
    }
  }
  return out;
}
