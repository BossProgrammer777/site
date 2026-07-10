// Канал доставки сообщений клиенту. Абстракция нужна, чтобы бот мог работать
// и через Instagram (боевой режим), и через консоль (локальный тест) — логика
// консультанта и инструменты остаются одни и те же.

import { sendText as igText, sendImage as igImage } from './instagram.js';

export interface Channel {
  sendText(recipientId: string, text: string): Promise<void>;
  sendImage(recipientId: string, url: string): Promise<void>;
}

/** Боевой канал — Instagram Direct. */
export const instagramChannel: Channel = {
  sendText: igText,
  sendImage: igImage,
};

/** Тестовый канал — печатает в консоль (для npm run chat). */
export const consoleChannel: Channel = {
  async sendText(_recipientId, text) {
    console.log(`\n📩 [клиенту]:\n${text}\n`);
  },
  async sendImage(_recipientId, url) {
    console.log(`\n🖼  [фото клиенту]: ${url}`);
  },
};
