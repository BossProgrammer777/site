// Локальный тест-чат: общение с ИИ-консультантом прямо в консоли, без Instagram.
// Запуск: npm run chat
// Нужны только ANTHROPIC_API_KEY, SITE_URL и (для оформления заказа) Telegram.
// Карточки товаров и ответы печатаются в консоль; реальные заказы и вызов
// менеджера всё так же уходят в вашу Telegram-группу — так вы видите весь путь.

import 'dotenv/config';
import readline from 'node:readline';
import { config } from './config.js';
import { getSession } from './sessions.js';
import { runAgent } from './agent.js';
import { consoleChannel } from './channel.js';

const SENDER = 'cli-test-user';

console.log('────────────────────────────────────────────');
console.log('  Bootsbaza — тест-чат ИИ-консультанта');
console.log(`  Каталог: ${config.siteUrl}`);
console.log('  Пишите как клиент. Выход — Ctrl+C.');
console.log('────────────────────────────────────────────\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(): void {
  rl.question('Вы: ', async (line) => {
    const text = line.trim();
    if (!text) {
      ask();
      return;
    }
    const session = getSession(SENDER);
    try {
      const reply = await runAgent(session, text, {
        recipientId: SENDER,
        session,
        channel: consoleChannel,
      });
      console.log(`\nБот: ${reply || '(бот выполнил действие без текста)'}\n`);
    } catch (e) {
      console.error('\n⚠️  Ошибка:', (e as Error).message, '\n');
    }
    ask();
  });
}

ask();
