// Состояние диалога по каждому пользователю Instagram (в памяти).
// Для продакшена на нескольких инстансах это можно заменить на Redis —
// интерфейс намеренно простой.

import type Anthropic from '@anthropic-ai/sdk';

export interface Session {
  senderId: string;
  messages: Anthropic.MessageParam[];
  // Клиент попросил живого менеджера — бот замолкает, чтобы не мешать.
  paused: boolean;
  lastActive: number;
  // slug'и товаров, чьи фото-карточки уже отправлены клиенту — чтобы не слать дважды.
  shownSlugs: Set<string>;
  // Счётчик сообщений без намёка на покупку и флаг «замолчать» (антитролль).
  nonBuyStrikes: number;
  muted: boolean;
  // Простая очередь, чтобы два сообщения подряд не запускали петлю параллельно.
  lock: Promise<void>;
  // Буфер для склейки сообщений, пришедших подряд (фото + подпись «Такі?» и т.п.),
  // чтобы отвечать одним сообщением, а не на каждое событие отдельно.
  pendingTexts: string[];
  pendingImages: string[];
  pendingTimer: ReturnType<typeof setTimeout> | null;
  // Пока бот на паузе (менеджер ведёт диалог) — сюда пишем реплики клиента и
  // менеджера, чтобы после возврата бот продолжил с полным контекстом.
  handoffLog: string[];
}

const SESSIONS = new Map<string, Session>();
const MAX_MESSAGES = 40; // сколько реплик диалога держим в контексте
const TTL_MS = 6 * 60 * 60 * 1000; // 6 часов бездействия — сбрасываем

export function getSession(senderId: string): Session {
  let s = SESSIONS.get(senderId);
  const now = Date.now();
  if (s && now - s.lastActive > TTL_MS) {
    SESSIONS.delete(senderId);
    s = undefined;
  }
  if (!s) {
    s = {
      senderId,
      messages: [],
      paused: false,
      lastActive: now,
      shownSlugs: new Set(),
      nonBuyStrikes: 0,
      muted: false,
      lock: Promise.resolve(),
      pendingTexts: [],
      pendingImages: [],
      pendingTimer: null,
      handoffLog: [],
    };
    SESSIONS.set(senderId, s);
  }
  s.lastActive = now;
  return s;
}

/**
 * Подрезает историю до MAX_MESSAGES так, чтобы массив всегда начинался с
 * user-сообщения с текстом (строкой) — иначе можно оставить «висящий»
 * tool_result без своего tool_use и получить 400 от API.
 */
export function trimHistory(s: Session): void {
  if (s.messages.length <= MAX_MESSAGES) return;
  let start = s.messages.length - MAX_MESSAGES;
  while (
    start < s.messages.length &&
    !(s.messages[start].role === 'user' && typeof s.messages[start].content === 'string')
  ) {
    start++;
  }
  if (start >= s.messages.length) return; // не нашли безопасную точку — не трогаем
  s.messages = s.messages.slice(start);
}

/** Пишет строку в лог передачи менеджеру (с ограничением — храним последние 40). */
export function logHandoff(s: Session, line: string): void {
  const t = line.trim();
  if (!t) return;
  s.handoffLog.push(t);
  if (s.handoffLog.length > 40) s.handoffLog.splice(0, s.handoffLog.length - 40);
}

/** Ставит задачу в очередь пользователя (последовательная обработка). */
export function runExclusive(s: Session, task: () => Promise<void>): Promise<void> {
  const next = s.lock.then(task, task);
  // Проглатываем ошибку в цепочке блокировки, но возвращаем оригинальный промис.
  s.lock = next.catch(() => undefined);
  return next;
}
