// HTTP-сервер бота: приём вебхуков Instagram и запуск ИИ-консультанта.
// Запуск: npm run dev (или npm start). Порт — из PORT (по умолчанию 8080).

import express, { type Request, type Response } from 'express';
import { config } from './config.js';
import {
  parseIncoming,
  verifySignature,
  sendText,
  markSeen,
  typingOn,
} from './instagram.js';
import { getSession, runExclusive } from './sessions.js';
import { runAgent } from './agent.js';
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
  res.json({ ok: true });
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
        const reply = await runAgent(session, text, { recipientId: senderId, session });
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
  console.log(`Bootsbaza IG-бот слушает на порту ${config.port}`);
  console.log(`Источник каталога: ${config.siteUrl}`);
  console.log(`Graph API: ${config.instagram.graphBase}`);
});
