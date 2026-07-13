// Инструменты ИИ-консультанта. Каждый инструмент — это то, что бот реально
// умеет делать: искать товар, показать карточку клиенту, оформить заказ,
// позвать живого менеджера. Побочные эффекты (отправка фото клиенту,
// уведомление в группу) выполняются здесь, а модель лишь решает, когда их звать.

import type Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import {
  searchProducts,
  getProductBySlug,
  productLink,
  productImage,
  availableSizes,
  type Product,
} from './catalog.js';
import { notifyGroup, escapeHtml } from './telegram.js';
import { appendOrderRow } from './googleSheet.js';
import { fetchOrderMeta } from './catalog.js';
import { config } from './config.js';
import type { Session } from './sessions.js';
import type { Channel } from './channel.js';

/** Слово-категория → slug раздела каталога (для ссылки с фильтрами). */
function categorySlug(word: string): string | null {
  const t = (word || '').toLowerCase();
  if (/бутс/.test(t)) return 'butsy';
  if (/сороконіж|сороконож|багатошип|многошип/.test(t)) return 'sorokonizhky';
  if (/футзал/.test(t)) return 'futzalky';
  if (/дитяч|детс|ребен|дітей/.test(t)) return 'dytiache-vzuttia';
  if (/гетр|шкарпет|носк|щитк|воротар|вратар|термо|сумк|мяч|м['’ʼ]?яч|екіп|экип|аксес/.test(t))
    return 'ekipiruvannia';
  return null;
}

/** Слово-бренд → каноническое имя бренда (как в фасете каталога). */
function canonBrand(word: string): string | null {
  const t = (word || '').toLowerCase();
  if (/new balance|нью ?баланс/.test(t)) return 'New Balance';
  if (/nike|найк/.test(t)) return 'Nike';
  if (/adidas|ад[іи]дас/.test(t)) return 'Adidas';
  if (/puma|пума/.test(t)) return 'Puma';
  if (/mizuno|м[іи]зуно/.test(t)) return 'Mizuno';
  if (/joma|джома/.test(t)) return 'Joma';
  if (/under armour|андер армор/.test(t)) return 'Under Armour';
  if (/umbro|умбро/.test(t)) return 'Umbro';
  if (/kelme|кельме/.test(t)) return 'Kelme';
  if (/diadora|діадора/.test(t)) return 'Diadora';
  if (/lotto|лотто/.test(t)) return 'Lotto';
  if (/asics|ас[іи]кс/.test(t)) return 'Asics';
  if (/reebok|р[іи]бок/.test(t)) return 'Reebok';
  if (/nivia|н[іи]в[іи]а/.test(t)) return 'Nivia';
  return null;
}

/** Короткая «позиция» для учётной таблицы: Б/С/Ф/Мяч + бренд+модель. */
function shortPosition(name: string): string {
  const n = (name || '').trim();
  const low = n.toLowerCase();
  let letter = '';
  if (/^бутс/.test(low)) letter = 'Б';
  else if (/^сороконіж|^сороконож/.test(low)) letter = 'С';
  else if (/^футзал/.test(low)) letter = 'Ф';
  else if (/м['’ʼ]?яч|мяч/.test(low)) letter = 'Мяч';
  const rest = n
    .replace(/^(бутси|бутсы|сороконіжки|сороконожки|футзалки|м['’ʼ]?ячі?|мяч[іи]?)\s*/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
  return (letter ? letter + ' ' : '') + rest;
}

// Корни слов-цветов (для фото-поиска их вырезаем из запроса — цвета нет в
// названии товара, он виден только на картинке; иначе строгий поиск даст ноль).
// Сравниваем по НАЧАЛУ слова (startsWith), чтобы не задеть модели: напр.
// «Predator» содержит «red» внутри, но не начинается с него — не трогаем.
const COLOR_ROOTS = [
  'бірюз', 'бирюз', 'turquoise', 'teal', 'рожев', 'розов', 'pink', 'біл', 'бел', 'white',
  'чорн', 'черн', 'black', 'зелен', 'салат', 'green', 'lime', 'син', 'блакит', 'голуб',
  'blue', 'navy', 'жовт', 'желт', 'yellow', 'помаранч', 'оранж', 'orange', 'корал', 'coral',
  'червон', 'красн', 'red', 'сір', 'сер', 'grey', 'gray', 'silver', 'срібл', 'серебр',
  'фіолет', 'фиолет', 'purple', 'violet', 'золот', 'gold', 'бежев', 'beige',
  'темн', 'светл', 'світл', 'dark', 'light', 'неон', 'neon',
  'колір', 'кольор', 'цвет', 'расцвет', 'розцвіт', 'color', 'colour',
];

/** Убирает из запроса слова-цвета — для строгого фото-поиска по модели. */
function stripColorWords(query: string): string {
  const tokens = (query || '').toLowerCase().split(/[\s/–—-]+/).filter(Boolean);
  const kept = tokens.filter((w) => !COLOR_ROOTS.some((r) => w.startsWith(r)));
  return (kept.length ? kept : tokens).join(' ');
}

// Под-линейки/уровни, которые модель путает по фото (низкий Vapor ↔ высокий
// Superfly и т.п.). Для фото-поиска убираем их — ищем по семейству, а точную
// пару модель выбирает глазами. Убираем только если остаётся бренд+семейство
// (≥2 слова), чтобы не расширить поиск до «все Nike».
const SUBLINE_WORDS = ['vapor', 'superfly', 'elite', 'academy', 'pro', 'club', 'zoom', 'air'];
function stripSublineWords(query: string): string {
  const tokens = (query || '').toLowerCase().split(/\s+/).filter(Boolean);
  const kept = tokens.filter((w) => !SUBLINE_WORDS.includes(w));
  return kept.length >= 2 ? kept.join(' ') : query;
}

/**
 * Фильтр по типу покрытия (для фото-поиска). Названия товаров всегда начинаются
 * с типа: «Бутси…» (FG), «Сороконіжки…» (TF), «Футзалки…» (IC) — по нему и режем,
 * чтобы не мешать бутсы с сороконожками в одной расцветке.
 */
function coverageMatcher(cov: string): ((name: string) => boolean) | null {
  const c = (cov || '').toLowerCase();
  if (!c) return null;
  if (/бутс|fg|boot|газон/.test(c)) return (n) => /бутс/i.test(n);
  if (/сороконіж|сороконож|tf|turf|штуч|багатошип|многошип/.test(c)) return (n) => /сороконіж|сороконож/i.test(n);
  if (/футзал|ic|indoor|зал/.test(c)) return (n) => /футзал/i.test(n);
  return null;
}

/** № отделения Новой Почты из строки отделения. */
function npNumber(warehouse: string): string {
  const w = warehouse || '';
  const m = w.match(/№\s*([0-9]+)/) || w.match(/(\d+)\s*$/) || w.match(/(\d+)/);
  return m ? m[1] : '';
}

export interface ToolContext {
  recipientId: string;
  session: Session;
  channel: Channel;
}

const uah = (n: number) => `${Math.round(n).toLocaleString('uk-UA')} грн`;

/**
 * Скачивает картинку товара, УМЕНЬШАЕТ её (≤768px, JPEG) и возвращает image-блок
 * для модели. Уменьшение обязательно: при показе многих фото сразу API требует
 * каждую ≤2000px, а большие картинки переполняют запрос (413) и память (OOM).
 * Для сравнения расцветок 768px более чем достаточно.
 */
async function catalogImageBlock(url: string): Promise<Anthropic.ImageBlockParam | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    if (input.byteLength < 100) return null;
    const out = await sharp(input)
      .rotate()
      .resize({ width: 768, height: 768, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 72 })
      .toBuffer();
    return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: out.toString('base64') } };
  } catch {
    return null;
  }
}

/** Выполняет асинхронную функцию над списком с ограничением параллелизма
 *  (чтобы не держать в памяти десятки больших картинок одновременно). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

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
    name: 'match_photo',
    description:
      'Сравнить фото, которое прислал клиент, с товарами каталога и найти ТОЧНОЕ совпадение по модели И расцветке. ' +
      'Возвращает фото ВСЕХ расцветок модели, чтобы ты глазами сравнил их с фото клиента. ' +
      'Используй это, когда клиент прислал фото/скриншот и спрашивает «есть такие?». НЕ используй search_products для фото-запроса.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Бренд + СЕМЕЙСТВО модели (напр. «Nike Mercurial», «Nike Phantom», «Adidas Predator», «Adidas X»). ' +
            'НЕ указывай под-линейку/версию (Vapor, Superfly, Elite, Academy, XV/XVI) и НЕ указывай цвет — их легко перепутать по фото. ' +
            'Инструмент вернёт ВСЕ расцветки и варианты семейства этого типа, а ты выберешь ТОЧНОЕ совпадение (крой + цвет) глазами по картинкам.',
        },
        coverage: {
          type: 'string',
          enum: ['бутси', 'сороконіжки', 'футзалки'],
          description:
            'ОБЯЗАТЕЛЬНО определи тип покрытия по фото КЛИЕНТА — иначе вернётся мешанина бутс и сороконожек: ' +
            '«бутси» — обувь с крупными редкими шипами (FG, для натурального газона); ' +
            '«сороконіжки» — много мелких шипов/резиновых пупырышек по всей подошве (TF, для искусственного поля); ' +
            '«футзалки» — плоская гладкая подошва без шипов (IC, для зала).',
        },
      },
      required: ['query', 'coverage'],
    },
  },
  {
    name: 'catalog_link',
    description:
      'Собрать ссылку на каталог сайта с уже выбранными фильтрами (категория, бренд, размер). ' +
      'Используй для ШИРОКИХ запросов — когда клиент назвал категорию (и, возможно, бренд/размер), но НЕ конкретную модель ' +
      '(напр. «бутси найк 43», «футзалки адідас», «дитячі бутси 35»). Пришли клиенту эту ОДНУ ссылку, чтобы он посмотрел все варианты на сайте, а не кучей карточек.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'категория словами: бутсы / сороконожки / футзалки / детские / щитки / гетры / мячи / вратарское и т.п.',
        },
        brand: { type: 'string', description: 'бренд (nike/adidas/puma…), если назван' },
        size: { type: 'string', description: 'размер EU, если назван' },
        query: { type: 'string', description: 'свободный текст, если не подходит под категорию/бренд' },
      },
    },
  },
  {
    name: 'send_product_card',
    description:
      'Показать клиенту фото товара(ов) с ценой и ссылкой. Это ЕДИНСТВЕННЫЙ способ показать товар — ' +
      'без вызова этого инструмента клиент фото/ссылку не увидит. Чтобы показать несколько вариантов, передай их ' +
      'списком в slugs ОДНИМ вызовом (1–4 товара). После этого кратко прокомментируй текстом.',
    input_schema: {
      type: 'object',
      properties: {
        slugs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Список slug товаров для показа (1–4). Показывай все предложенные варианты одним вызовом.',
        },
        slug: { type: 'string', description: 'Один slug (если карточка одна). Можно вместо slugs.' },
      },
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

type ToolResult = string | (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[];

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'match_photo': {
        // Возвращаем модели фото ВСЕХ расцветок ИМЕННО ЭТОЙ модели (расцветка
        // видна только на картинке, в названии её нет), чтобы модель визуально
        // нашла точное совпадение по цвету.
        // Поиск СТРОГИЙ (все слова модели должны совпасть): «Nike Mercurial Vapor»
        // вернёт только Vapor, а не Superfly. Из запроса убираем слова-цвета, чтобы
        // они не обнуляли строгий поиск (цвета в названиях нет — он на картинке).
        // Убираем цвет И под-линейку (Vapor/Superfly/Elite…): модель часто путает
        // низкий Vapor с высоким Superfly. Ищем по СЕМЕЙСТВУ (Nike Mercurial),
        // возвращаем обе линейки, а точную пару модель выберет глазами по фото.
        const query = stripSublineWords(stripColorWords(String(input.query || '')));
        const coverage = String(input.coverage || '');
        // Показываем расцветки семейства нужного типа. Картинки уменьшаем (768px),
        // так что 30 штук безопасно влезают в запрос и память.
        const MAX_CANDIDATES = 30;
        let pool = (await searchProducts(query, 200)).filter((p) => p.anyInStock);
        // Режем по типу покрытия (бутси/сороконіжки/футзалки), если модель его
        // определила по фото — тогда покажем ВСЕ расцветки именно нужного типа.
        const typeMatcher = coverageMatcher(coverage);
        if (typeMatcher) {
          const typed = pool.filter((p) => typeMatcher(p.name));
          if (typed.length) pool = typed;
        }
        const found = pool.slice(0, MAX_CANDIDATES);
        // Диагностика: видно в логах Render, ЧТО именно запросила модель и какие
        // коды к ней попали (чтобы отличить проблему поиска от ошибки модели).
        console.error(
          `[match_photo] q=${JSON.stringify(query)} cov=${JSON.stringify(coverage)} -> ${found.length}: ${found.map((p) => p.code).join(',')}`,
        );
        if (!found.length) {
          return JSON.stringify({
            found: 0,
            message: 'В каталоге такой модели нет вообще. Скажи клиенту честно и предложи посмотреть похожие модели (search_products).',
          });
        }
        const covLabel = coverage ? ` типа «${coverage}»` : '';
        const blocks: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[] = [
          {
            type: 'text',
            text:
              `Ниже ВСЕ расцветки этой модели${covLabel} из каталога (${found.length} шт.), которые есть в наличии. ` +
              'Внимательно просмотри КАЖДУЮ картинку и сравни с фото клиента по цвету. Расцветка есть только на картинке — не в названии, ' +
              'поэтому нельзя судить по тексту, надо смотреть глазами. Тип покрытия (бутси/сороконіжки/футзалки) виден в НАЗВАНИИ — ' +
              'предлагай товар ТОГО ЖЕ типа, что на фото клиента, не подменяй бутсы сороконожками. ' +
              'Если нашёл совпадение по расцветке (пусть даже близкое) — покажи именно её через send_product_card и переходи к оформлению. ' +
              'НЕ говори «нет», пока не просмотрел все карточки ниже. Если точь-в-точь такой расцветки правда нет — ' +
              'покажи 2–3 самые близкие по цвету карточками и предложи их, а не просто отказывай.',
          },
        ];
        // Качаем и уменьшаем картинки с ограничением параллелизма (по 4 за раз),
        // чтобы не держать десятки больших изображений в памяти одновременно.
        const imgs = await mapLimit(found, 4, (p) => {
          const url = productImage(p);
          return url ? catalogImageBlock(url) : Promise.resolve(null);
        });
        found.forEach((p, i) => {
          blocks.push({
            type: 'text',
            text: `slug=${p.slug} · ${p.name} · ${uah(p.finalPrice)} · розміри: ${availableSizes(p).join(', ') || '—'}`,
          });
          if (imgs[i]) blocks.push(imgs[i]!);
        });
        return blocks;
      }

      case 'search_products': {
        const query = String(input.query || '');
        const limit = Math.min(8, Math.max(1, Number(input.limit) || 6));
        const found = await searchProducts(query, limit);
        if (!found.length) return JSON.stringify({ found: 0, products: [], hint: 'Ничего не найдено — предложи уточнить запрос или показать похожее.' });

        // АВТОПОКАЗ: сразу шлём клиенту фото-карточки найденного (до 4 новых, в наличии).
        // Так бот физически не может «забыть» показать товар — карточки уходят всегда.
        const toShow = found
          .filter((p) => p.anyInStock && !ctx.session.shownSlugs.has(p.slug))
          .slice(0, 4);
        for (const p of toShow) {
          const img = productImage(p);
          const text = `${p.name}\n${uah(p.finalPrice)}\n${productLink(p)}`;
          if (img) await ctx.channel.sendImage(ctx.recipientId, img);
          await ctx.channel.sendText(ctx.recipientId, text);
          ctx.session.shownSlugs.add(p.slug);
        }
        return JSON.stringify({
          found: found.length,
          shown_as_cards: toShow.map((p) => p.slug),
          products: found.map(productBrief),
          note: toShow.length
            ? 'Клиенту УЖЕ отправлены фото-карточки этих товаров (фото+цена+ссылка). НЕ перечисляй их списком в тексте — просто кратко прокомментируй показанное и задай следующий вопрос.'
            : 'Карточки не отправлены (нет в наличии или уже показывались). Не выдумывай отправку фото.',
        });
      }

      case 'get_product': {
        const p = await getProductBySlug(String(input.slug || ''));
        if (!p) return JSON.stringify({ error: 'Товар не найден' });
        return JSON.stringify({ product: productBrief(p) });
      }

      case 'catalog_link': {
        const params = new URLSearchParams();
        const slug = input.category ? categorySlug(String(input.category)) : null;
        const brand = input.brand ? canonBrand(String(input.brand)) : null;
        const size = String(input.size || '').trim();
        const query = String(input.query || '').trim();
        if (slug) params.set('section', slug);
        if (brand) params.set('brand', brand);
        if (size) params.set('size', size);
        if (query && !slug && !brand) params.set('q', query);
        const qs = params.toString();
        const url = `${config.siteUrl}/catalog${qs ? '?' + qs : ''}`;
        return JSON.stringify({
          url,
          note: 'Отправь клиенту ЭТУ ссылку в тексте (Instagram сам сделает её кликабельной) и предложи выбрать вариант на сайте. НЕ шли карточки для этого запроса.',
        });
      }

      case 'send_product_card': {
        // Принимаем и список slugs, и одиночный slug.
        const raw = Array.isArray(input.slugs) ? input.slugs.map(String) : [];
        if (input.slug) raw.push(String(input.slug));
        const slugs = [...new Set(raw.map((s) => s.trim()).filter(Boolean))].slice(0, 4);
        if (!slugs.length) return JSON.stringify({ error: 'Не указаны slug товаров — карточка не отправлена' });

        const sent: string[] = [];
        for (const slug of slugs) {
          const p = await getProductBySlug(slug);
          if (!p) continue;
          // Шлём ТОЛЬКО ссылку — её превью в Instagram само показывает фото и название
          // товара. Ни фото-вложения, ни текста с ценой — чтобы не было дублей.
          await ctx.channel.sendText(ctx.recipientId, productLink(p));
          ctx.session.shownSlugs.add(slug);
          sent.push(slug);
        }
        if (!sent.length) return JSON.stringify({ error: 'Товары не найдены — карточки не отправлены' });
        return JSON.stringify({ sent: sent.length, slugs: sent });
      }

      case 'create_order': {
        const rawItems = Array.isArray(input.items) ? input.items : [];

        // Защита от подмены модели: оформить можно ТОЛЬКО товар, который бот
        // реально показал клиенту карточкой (реальное фото/расцветка) и клиент
        // подтвердил. Если товар не показывался — просим сначала показать.
        const notShown = (rawItems as Record<string, unknown>[])
          .map((it) => String(it.slug || '').trim())
          .filter((s) => s && !ctx.session.shownSlugs.has(s));
        if (notShown.length) {
          return JSON.stringify({
            error: 'not_shown',
            slugs: notShown,
            message:
              'Эти товары ты ещё НЕ показывал клиенту карточкой: ' +
              notShown.join(', ') +
              '. Сначала покажи именно их через send_product_card — чтобы клиент увидел реальное фото и расцветку и подтвердил, что это то самое, — и только потом оформляй заказ. НИКОГДА не оформляй модель/расцветку, которую не показывал.',
          });
        }

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

        // Пишем заказ в учётную таблицу: одна строка = один товар. Дату ставит
        // сам скрипт таблицы. Дроп-цену и см берём из закрытого эндпоинта сайта.
        // Строки пишем ПОСЛЕДОВАТЕЛЬНО — скрипт считает строку по счётчику A1,
        // параллельные запросы могли бы попасть в одну строку.
        const np = npNumber(warehouse);
        const sheetTask = (async () => {
          let anySaved = false;
          for (const l of lines) {
            const meta = await fetchOrderMeta(l.code, l.size);
            const position = (l.qty > 1 ? `${l.qty} ` : '') + shortPosition(l.name);
            const r = await appendOrderRow({
              name,
              city,
              np,
              phone,
              project: 'BBaza',
              supplier: 'FootballOpt',
              position,
              eu: l.size,
              cm: meta.cm,
              drop: meta.drop,
              price: l.price,
            }).catch(() => ({ saved: false }));
            if (r.saved) anySaved = true;
          }
          return anySaved;
        })();

        const [, savedToSheet] = await Promise.all([notifyGroup(text, lines[0].image), sheetTask]);
        return JSON.stringify({
          ok: true,
          total,
          total_text: uah(total),
          saved_to_sheet: savedToSheet,
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

/**
 * Диагностика фото-поиска (команда «!diag <модель>» от владельца в Директе).
 * Показывает, какие товары реально попадают в кандидаты по строгому поиску,
 * есть ли товар в наличии и грузится ли его фото. Только публичные данные.
 */
export async function runDiagnostic(rawQuery: string): Promise<string> {
  const q = rawQuery.trim();
  if (!q) return 'Формат: !diag <бренд модель>, напр. «!diag Nike Mercurial Vapor»';
  const stripped = stripColorWords(q);
  const matches = (await searchProducts(stripped, 25)).filter(() => true);
  if (!matches.length) {
    return `🔎 Запит: "${q}"\nСтрогий пошук по: "${stripped}"\nНічого не знайдено. Схоже, у каталозі немає товару з такими словами в назві.`;
  }
  const rows = await Promise.all(
    matches.map(async (p) => {
      const url = productImage(p);
      const img = url ? await catalogImageBlock(url) : null;
      const stock = p.anyInStock ? '✅' : '⛔';
      const photo = img ? '📷' : url ? '⚠️' : '—';
      return `${stock}${photo} ${p.code || '—'} · ${p.name}`;
    }),
  );
  const head = `🔎 "${q}" → строгий пошук: "${stripped}"\nЗнайдено: ${matches.length} (✅в наявності ⛔нема · 📷фото ок ⚠️фото не грузиться)\n\n`;
  return (head + rows.join('\n')).slice(0, 950);
}
