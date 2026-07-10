// HTTP-сервер бота: приём вебхуков Instagram и запуск ИИ-консультанта.
// Запуск: npm run dev (или npm start). Порт — из PORT (по умолчанию 8080).

import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { config, instagramConfigured } from './config.js';
import {
  parseIncoming,
  verifySignature,
  sendText,
  markSeen,
  typingOn,
  subscribeToMessages,
} from './instagram.js';
import { getSession, runExclusive } from './sessions.js';
import { runAgent } from './agent.js';
import { instagramChannel, type Channel } from './channel.js';
import { WEBCHAT_HTML } from './webchat.js';
import { PRIVACY_HTML } from './privacy.js';
import { notifyGroup, escapeHtml } from './telegram.js';

const app = express();

// Сохраняем «сырое» тело для проверки подписи X-Hub-Signature-256.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);

app.get('/health', (_req, res) => {
  res.json({ ok: true, instagram: instagramConfigured() });
});

// --- Веб-чат (тестовая страница в браузере) ----------------------------------
app.get('/', (_req, res) => {
  res.type('html').send(WEBCHAT_HTML);
});

// Политика конфиденциальности (нужна для публикации приложения в Meta).
app.get('/privacy', (_req, res) => {
  res.type('html').send(PRIVACY_HTML);
});

// Подписка приложения на сообщения аккаунта (замена глючного тумблера в Meta).
// Открой этот адрес в браузере — увидишь {"success":true}, если всё ок.
app.get('/setup', async (_req, res) => {
  if (!instagramConfigured()) {
    res.status(400).json({ error: 'Instagram не настроен (нет IG_ACCESS_TOKEN)' });
    return;
  }
  const r = await subscribeToMessages();
  res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status, response: r.body });
});

app.post('/api/chat', async (req: Request, res: Response) => {
  const { sessionId, message, password } = (req.body || {}) as {
    sessionId?: string;
    message?: string;
    password?: string;
  };
  if (config.webChatPassword && password !== config.webChatPassword) {
    res.status(401).json({ error: 'Неверный пароль' });
    return;
  }
  const text = (message || '').trim();
  const id = (sessionId || '').trim();
  if (!text || !id) {
    res.status(400).json({ error: 'Пустое сообщение' });
    return;
  }

  const session = getSession(`web:${id}`);
  // Канал, который собирает карточки товаров, чтобы вернуть их странице.
  const cards: ({ kind: 'image'; url: string } | { kind: 'text'; text: string })[] = [];
  const webChannel: Channel = {
    async sendText(_r, t) {
      cards.push({ kind: 'text', text: t });
    },
    async sendImage(_r, url) {
      cards.push({ kind: 'image', url });
    },
  };

  try {
    const reply = await runAgent(session, text, { recipientId: `web:${id}`, session, channel: webChannel });
    res.json({ reply, cards, paused: session.paused });
  } catch (e) {
    console.error('[webchat] ошибка:', (e as Error).message);
    res.status(500).json({ error: (e as Error).message });
  }
});

// --- Верификация вебхука (Meta присылает GET при подключении) -----------------
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === config.instagram.verifyToken) {
    res.status(200).send(String(challenge ?? ''));
  } else {
    res.sendStatus(403);
  }
});

// --- Входящие сообщения -------------------------------------------------------
app.post('/webhook', (req: Request, res: Response) => {
  if (!instagramConfigured()) {
    res.sendStatus(200); // Instagram ещё не настроен — просто игнорируем
    return;
  }
  const raw = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from('');
  if (!verifySignature(raw, req.header('x-hub-signature-256'))) {
    res.sendStatus(403);
    return;
  }

  // Meta ждёт быстрый 200 — обрабатываем сообщения асинхронно.
  res.sendStatus(200);

  const incoming = parseIncoming(req.body);
  for (const { senderId, text } of incoming) {
    const session = getSession(senderId);

    // Диалог переведён на живого менеджера — бот молчит, но извещает группу.
    if (session.paused) {
      notifyGroup(
        `✉️ <b>Нове повідомлення від клієнта (ручний режим)</b>\n\n${escapeHtml(text)}`,
      ).catch(() => undefined);
      continue;
    }

    runExclusive(session, async () => {
      try {
        await markSeen(senderId);
        await typingOn(senderId);
        const reply = await runAgent(session, text, {
          recipientId: senderId,
          session,
          channel: instagramChannel,
        });
        if (reply) {
          await sendText(senderId, reply);
        } else if (!session.paused) {
          await sendText(
            senderId,
            'Дякую за повідомлення! Уточніть, будь ласка, що саме шукаєте (модель, розмір), і я підберу варіанти 🙌',
          );
        }
      } catch (e) {
        console.error('[agent] ошибка обработки сообщения:', (e as Error).message);
        await sendText(
          senderId,
          'Вибачте, стався технічний збій. Спробуйте, будь ласка, ще раз — або напишіть «менеджер», і з вами зв’яжеться людина.',
        ).catch(() => undefined);
      }
    });
  }
});

app.listen(config.port, () => {
  // Подписываем приложение на сообщения аккаунта (best-effort) при старте.
  if (instagramConfigured()) {
    subscribeToMessages().then((r) =>
      console.log(`[instagram] subscribe messages: ok=${r.ok} status=${r.status} ${r.body}`),
    );
  }
  console.log(`Bootsbaza-бот слушает на порту ${config.port}`);
  console.log(`Веб-чат для теста: открой корневой URL в браузере`);
  console.log(`Источник каталога: ${config.siteUrl}`);
  console.log(
    instagramConfigured()
      ? `Instagram: подключён (${config.instagram.graphBase})`
      : `Instagram: НЕ настроен — работает только веб-чат (это нормально для теста)`,
  );
});
