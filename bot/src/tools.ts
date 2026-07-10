// Инструменты ИИ-консультанта. Каждый инструмент — это то, что бот реально
// умеет делать: искать товар, показать карточку клиенту, оформить заказ,
// позвать живого менеджера. Побочные эффекты (отправка фото клиенту,
// уведомление в группу) выполняются здесь, а модель лишь решает, когда их звать.

import type Anthropic from '@anthropic-ai/sdk';
import {
  searchProducts,
  getProductBySlug,
  productLink,
  productImage,
  availableSizes,
  type Product,
} from './catalog.js';
import { notifyGroup, escapeHtml } from './telegram.js';
import type { Session } from './sessions.js';
import type { Channel } from './channel.js';

export interface ToolContext {
  recipientId: string;
  session: Session;
  channel: Channel;
}

const uah = (n: number) => `${Math.round(n).toLocaleString('uk-UA')} грн`;

function productBrief(p: Product) {
  const sizes = availableSizes(p);
  return {
    slug: p.slug,
    name: p.name,
    group: p.group,
    country: p.country,
    price: p.finalPrice,
    price_text: uah(p.finalPrice),
    in_stock: p.anyInStock,
    available_sizes: sizes,
    link: productLink(p),
  };
}

// --- Определения инструментов (передаются в API) -----------------------------

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_products',
    description:
      'Найти товары в каталоге Bootsbaza по запросу (бренд, тип, модель, цвет, страна — любые слова). ' +
      'Возвращает список с ценой, наличием и доступными размерами. Всегда используй перед тем, как предлагать варианты — не выдумывай товары и цены.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Поисковый запрос, напр. «Nike Tiempo», «детские футзалки», «щитки»' },
        limit: { type: 'integer', description: 'Сколько вернуть (1–8). По умолчанию 6.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_product',
    description:
      'Получить подробную карточку одного товара по slug (из результатов search_products): цена, наличие, все размеры, ссылка.',
    input_schema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
  },
  {
    name: 'send_product_card',
    description:
      'Отправить клиенту в Директ фото товара с короткой подписью (название, цена, ссылка). ' +
      'Используй, чтобы наглядно показать подобранные варианты (обычно 1–4 карточки). После отправки карточек кратко прокомментируй их текстом.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'slug товара из каталога' },
        caption: {
          type: 'string',
          description: 'Необязательная короткая подпись от себя (1 строка). Цена и ссылка добавятся автоматически.',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'create_order',
    description:
      'Оформить заказ и отправить его менеджерам. Вызывай, когда собрал: имя, телефон и хотя бы один товар с размером. ' +
      'Город/отделение Новой Почты и оплату указывай, если клиент назвал; если нет — менеджер уточнит. Не придумывай данные за клиента.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Имя клиента' },
        phone: { type: 'string', description: 'Телефон клиента' },
        items: {
          type: 'array',
          description: 'Товары в заказе',
          items: {
            type: 'object',
            properties: {
              slug: { type: 'string', description: 'slug товара из каталога' },
              size: { type: 'string', description: 'Размер (как в каталоге). Если клиент не назвал — пустая строка.' },
              qty: { type: 'integer', description: 'Количество, по умолчанию 1' },
            },
            required: ['slug'],
          },
        },
        city: { type: 'string', description: 'Город доставки (Новая Почта)' },
        warehouse: { type: 'string', description: 'Отделение/почтомат Новой Почты' },
        payment: {
          type: 'string',
          enum: ['Наложенный платёж', 'Предоплата'],
          description: 'Тип оплаты, если клиент выбрал',
        },
        comment: { type: 'string', description: 'Доп. пожелания клиента' },
      },
      required: ['name', 'phone', 'items'],
    },
  },
  {
    name: 'request_human',
    description:
      'Позвать живого менеджера: отправляет уведомление в группу и переводит диалог в ручной режим (бот замолкает). ' +
      'Используй, если клиент прямо просит человека/менеджера, при жалобе, нестандартном или спорном вопросе, оптовом запросе.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Коротко, зачем нужен менеджер' },
        phone: { type: 'string', description: 'Телефон клиента, если известен' },
      },
    },
  },
];

// --- Исполнение --------------------------------------------------------------

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  try {
    switch (name) {
      case 'search_products': {
        const query = String(input.query || '');
        const limit = Math.min(8, Math.max(1, Number(input.limit) || 6));
        const found = await searchProducts(query, limit);
        if (!found.length) return JSON.stringify({ found: 0, products: [], hint: 'Ничего не найдено — предложи уточнить запрос или показать похожее.' });
        return JSON.stringify({ found: found.length, products: found.map(productBrief) });
      }

      case 'get_product': {
        const p = await getProductBySlug(String(input.slug || ''));
        if (!p) return JSON.stringify({ error: 'Товар не найден' });
        return JSON.stringify({ product: productBrief(p) });
      }

      case 'send_product_card': {
        const p = await getProductBySlug(String(input.slug || ''));
        if (!p) return JSON.stringify({ error: 'Товар не найден, карточка не отправлена' });
        const img = productImage(p);
        const caption = String(input.caption || '').trim();
        const text =
          (caption ? `${caption}\n` : '') +
          `${p.name}\n${uah(p.finalPrice)}\n${productLink(p)}`;
        if (img) await ctx.channel.sendImage(ctx.recipientId, img);
        // Текст-подпись отдельным сообщением (у IG вложение и текст — разные посылки).
        await ctx.channel.sendText(ctx.recipientId, text);
        return JSON.stringify({ sent: true, had_photo: !!img, slug: p.slug });
      }

      case 'create_order': {
        const rawItems = Array.isArray(input.items) ? input.items : [];
        const lines: { name: string; code: string; size: string; qty: number; price: number; sum: number; image: string | null }[] = [];
        let total = 0;
        for (const it of rawItems as Record<string, unknown>[]) {
          const p = await getProductBySlug(String(it.slug || ''));
          if (!p) continue;
          const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
          const size = String(it.size || '').trim();
          const sum = p.finalPrice * qty;
          total += sum;
          lines.push({ name: p.name, code: p.code, size, qty, price: p.finalPrice, sum, image: productImage(p) });
        }
        if (!lines.length) return JSON.stringify({ error: 'Не удалось сопоставить товары — уточни slug из каталога' });

        const name = String(input.name || '').trim();
        const phone = String(input.phone || '').trim();
        const city = String(input.city || '').trim();
        const warehouse = String(input.warehouse || '').trim();
        const payment = String(input.payment || '').trim();
        const comment = String(input.comment || '').trim();

        const itemsText = lines
          .map(
            (l, i) =>
              `${i + 1}. <b>${escapeHtml(l.name)}</b>\n   Код: ${escapeHtml(l.code)} · Розмір: ${escapeHtml(l.size) || '<i>уточнити</i>'} · ${l.qty} × ${uah(l.price)} = <b>${uah(l.sum)}</b>`,
          )
          .join('\n');

        const text =
          `🛍 <b>Замовлення з Instagram Direct</b>\n\n` +
          `${itemsText}\n\n` +
          `💳 <b>Разом: ${uah(total)}</b>\n\n` +
          `👤 <b>Клієнт:</b> ${escapeHtml(name)}\n` +
          `📞 <b>Телефон:</b> ${escapeHtml(phone)}\n` +
          (city ? `🏙 <b>Місто:</b> ${escapeHtml(city)}\n` : '') +
          (warehouse ? `📦 <b>Відділення НП:</b> ${escapeHtml(warehouse)}\n` : '') +
          (payment ? `💳 <b>Оплата:</b> ${escapeHtml(payment)}\n` : '') +
          (comment ? `📝 <b>Коментар:</b> ${escapeHtml(comment)}\n` : '') +
          (!city || !warehouse ? `\n⚠️ <i>Уточнити доставку у клієнта.</i>` : '');

        await notifyGroup(text, lines[0].image);
        return JSON.stringify({
          ok: true,
          total,
          total_text: uah(total),
          message: 'Заказ отправлен менеджерам. Подтверди клиенту и скажи, что менеджер свяжется для подтверждения и уточнения деталей доставки.',
        });
      }

      case 'request_human': {
        ctx.session.paused = true;
        const reason = String(input.reason || '').trim();
        const phone = String(input.phone || '').trim();
        const text =
          `🙋 <b>Клієнт просить менеджера (Instagram Direct)</b>\n\n` +
          (reason ? `Причина: ${escapeHtml(reason)}\n` : '') +
          (phone ? `📞 Телефон: ${escapeHtml(phone)}\n` : '') +
          `\n⚠️ Бот призупинено для цього діалогу — підключіться в Direct вручну.`;
        await notifyGroup(text);
        return JSON.stringify({
          ok: true,
          message: 'Менеджеру отправлено уведомление, диалог переведён на человека. Скажи клиенту, что живой менеджер скоро подключится здесь, в Директе.',
        });
      }

      default:
        return JSON.stringify({ error: `Неизвестный инструмент: ${name}` });
    }
  } catch (e) {
    console.error(`[tool ${name}] ошибка:`, (e as Error).message);
    return JSON.stringify({ error: `Инструмент ${name} дал сбой: ${(e as Error).message}` });
  }
}
