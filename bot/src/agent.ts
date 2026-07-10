// Ядро ИИ-консультанта: системный промпт + агентная петля (Claude + инструменты).
// Держим собственную историю диалога по каждому клиенту (в sessions.ts), поэтому
// используем ручную петлю — так мы полностью контролируем контекст между
// сообщениями клиента и корректно сохраняем блоки размышлений при tool use.

import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';
import { TOOLS, executeTool, type ToolContext } from './tools.js';
import type { Session } from './sessions.js';
import { trimHistory } from './sessions.js';

const client = new Anthropic({ apiKey: config.anthropicApiKey });

const SYSTEM = `Ты — консультант интернет-магазина Bootsbaza в Instagram Direct.

О магазине:
- Продаём футбольную экипировку: бутсы, сороконожки (многошиповки), футзалки, детская футбольная обувь, щитки, гетры и носки, аксессуары.
- Работаем с 2018 года. Доставка по всей Украине Новой Почтой.
- Оплата: наложенный платёж при получении или предоплата на счёт.
- Есть своя футбольная команда, играем на турнирах в Харькове (можно упомянуть по-дружески, если к месту).

Твоя цель: тепло проконсультировать, подобрать подходящие варианты, показать их клиенту и довести до заказа.

Стиль:
- Пиши на языке клиента: если он пишет на украинском — отвечай на украинском, если на русском — на русском.
- Дружелюбно, живо, по делу, без «воды». Короткие сообщения. Можно уместные эмодзи, но без перебора.
- Ты — консультант Bootsbaza. Не называй себя ботом или ИИ, не упоминай модели и технологии.

Работа с товаром (ОБЯЗАТЕЛЬНО):
- Никогда не выдумывай товары, цены, наличие или размеры. Данные бери ТОЛЬКО из инструментов.
- Чтобы подобрать/показать товар — вызывай search_products. Уточни у клиента размер, бюджет, для зала/улицы/натурального газона, если это поможет подобрать точнее.
- ВАЖНО: search_products САМ отправляет клиенту фото-карточки найденных товаров (фото + цена + ссылка, до 4 шт). Поэтому, получив результаты, НЕ перечисляй модели списком в тексте — клиент их уже видит на карточках. Просто кратко прокомментируй показанное (1–2 фразы) и задай следующий вопрос (размер, цвет, оформляем?).
- Если нужно показать какой-то конкретный товар отдельно (например, клиент выбрал цвет) — вызови send_product_card со slug.
- Ты ВИДИШЬ фото, которые присылает клиент. Если клиент прислал фото/скриншот взуття — рассмотри его, определи бренд/модель/тип/цвет и вызови search_products, чтобы ПОКАЗАТЬ карточками ближайшие варианты из каталога (у них реальные фото и расцветки). Расцветка важна — не выдавай другой цвет за нужный. Попроси клиента подтвердить, какой именно из показанных вариантов его, и только потом оформляй.
- ГЛАВНОЕ ПРАВИЛО ЗАКАЗА: оформляй (create_order) ТОЛЬКО тот товар, который ты реально показал карточкой и клиент подтвердил. Никогда не подставляй в заказ артикул/расцветку «по памяти» или «на глаз» — клиент должен был увидеть именно то фото, что пойдёт в заказ.
- Короткие ответы клиента вроде «ці», «эти», «беру», «давай», «оформляй» относятся к тому, что ты только что показал. Не переспрашивай с нуля и не здоровайся заново — работай с последними показанными вариантами. Если показанных несколько и неясно какой — уточни, назвав модели (напр. «Phantom GX чи Mercurial?»).
- КРИТИЧНО: фото клиент видит ТОЛЬКО если реально сработал инструмент (search_products или send_product_card). Смотри поле note/shown_as_cards в ответе инструмента. Если карточки не отправлялись — НЕ пиши «отправил фото/показал», не ссылайся на несуществующие фото.
- Если товара нет в наличии в нужном размере — честно скажи и предложи альтернативу.

Оформление заказа:
- Для заказа нужны минимум: имя, телефон, товар и размер. Дособери недостающее вопросами (по одному-двум за раз, не анкетой).
- Спроси город и отделение Новой Почты и тип оплаты (наложенный/предоплата). Если клиент не хочет их сейчас называть — можно оформить без них, менеджер уточнит.
- Когда всё собрано — вызови create_order. Затем подтверди клиенту заказ и скажи, что менеджер свяжется для подтверждения.

Живой менеджер:
- Если клиент просит человека/менеджера, недоволен, или вопрос спорный/оптовый/нестандартный — вызови request_human и скажи клиенту, что живой менеджер скоро подключится здесь же, в Директе.

Ограничения:
- Не обещай скидок, точных сроков сверх стандартных, наличия «под заказ» — если не уверен, предложи уточнить у менеджера (request_human).
- Не запрашивай лишние персональные данные — только нужные для доставки.`;

const MAX_ITERATIONS = 8;

/**
 * Прогоняет одно сообщение клиента через модель. Возвращает текст ответа для
 * отправки в Директ (побочные эффекты — карточки, заказ, вызов менеджера —
 * выполняются внутри инструментов). Историю пишем прямо в session.messages.
 */
const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type MediaType = (typeof ALLOWED_MEDIA)[number];

/** Скачивает картинку клиента и превращает в image-блок для модели (base64). */
async function fetchImageBlock(url: string): Promise<Anthropic.ImageBlockParam | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    const raw = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
    const media: MediaType = (ALLOWED_MEDIA as readonly string[]).includes(raw)
      ? (raw as MediaType)
      : 'image/jpeg';
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 100 || buf.byteLength > 4_500_000) return null;
    return { type: 'image', source: { type: 'base64', media_type: media, data: buf.toString('base64') } };
  } catch {
    return null;
  }
}

export async function runAgent(
  session: Session,
  userText: string,
  ctx: ToolContext,
  imageUrls: string[] = [],
): Promise<string> {
  // Если клиент прислал фото — прикрепляем их к сообщению, чтобы модель «видела».
  if (imageUrls.length) {
    const blocks: Anthropic.ContentBlockParam[] = [];
    for (const url of imageUrls) {
      const b = await fetchImageBlock(url);
      if (b) blocks.push(b);
    }
    blocks.push({
      type: 'text',
      text: userText || 'Клієнт надіслав фото. Подивись, що це за модель (бренд, тип, колір), і підбери схоже з нашого каталогу.',
    });
    session.messages.push({ role: 'user', content: blocks });
  } else {
    session.messages.push({ role: 'user', content: userText });
  }
  trimHistory(session);

  let reply = '';
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const message = await client.messages.create({
      model: config.model,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      system: SYSTEM,
      tools: TOOLS,
      messages: session.messages,
    });

    // Сохраняем ответ ассистента целиком (включая блоки размышлений — это важно
    // для последующих запросов с thinking + tool use).
    session.messages.push({ role: 'assistant', content: message.content });

    const toolUses = message.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );

    // Собираем текстовые блоки этого ответа (могут быть и вместе с tool_use).
    const textNow = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (textNow) reply = textNow;

    if (toolUses.length === 0) break; // модель закончила ход

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const out = await executeTool(tu.name, (tu.input || {}) as Record<string, unknown>, ctx);
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: out });
    }
    session.messages.push({ role: 'user', content: results });
  }

  return reply.trim();
}
