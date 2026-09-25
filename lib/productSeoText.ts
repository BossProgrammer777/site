// ---------------------------------------------------------------------------
// Уникальный SEO-текст карточки товара: связное описание + характеристики.
// Собирается из полей товара, которые у каждого РАЗНЫЕ (название, артикул,
// страна, набор размеров в наличии, цена) — поэтому каждая страница получается
// текстово уникальной. Это снимает причину «страница-копия» в Search Console и
// помогает индексации (больше релевантного текста в SSR-HTML).
// ---------------------------------------------------------------------------

import type { Product } from './types';
import type { Locale } from './i18n';
import { detectBrand } from './brand';
import { localizeProductName, localizeCountry } from './productL10n';
import { formatUAH } from './format';

type Kind = 'boots' | 'turf' | 'indoor' | 'kids' | 'equip';

function sectionKind(sectionSlug: string, text = ''): Kind {
  if (sectionSlug === 'sorokonizhky') return 'turf';
  if (sectionSlug === 'futzalky') return 'indoor';
  if (sectionSlug === 'dytiache-vzuttia' || sectionSlug === 'nb-dytiache-vzuttia') return 'kids';
  if (sectionSlug === 'ekipiruvannia' || sectionSlug === 'nb-ekipiruvannia') return 'equip';
  // «Взуття без бренду» — один раздел на все виды обуви: вид берём из названия
  // (слово или маркировка подошвы), иначе — бутсы.
  if (sectionSlug === 'nb-vzuttia' && text) {
    const sole = soleFromName(text);
    if (/сороконіж|сороконож|багатошип|многошип/i.test(text) || sole === 'TF') return 'turf';
    if (/футзал/i.test(text) || sole === 'IC') return 'indoor';
  }
  return 'boots'; // butsy, nb-vzuttia
}

// Тип-экипировки как существительное (для «Тип» и вступления).
function equipType(name: string, ru: boolean): string {
  const low = name.toLowerCase();
  if (/гетр|носк|гольф/.test(low)) return ru ? 'Футбольные гетры' : 'Футбольні гетри';
  if (/щитк|захист гоміл/.test(low)) return ru ? 'Футбольные щитки' : 'Футбольні щитки';
  if (/воротар|вратар|рукавиц|перчатк/.test(low)) return ru ? 'Вратарские перчатки' : 'Воротарські рукавиці';
  if (/терм|компрес|білизн|белье/.test(low)) return ru ? 'Термобельё' : 'Термобілизна';
  if (/сумк/.test(low)) return ru ? 'Спортивная сумка' : 'Спортивна сумка';
  if (/м.?яч|мяч|ball/.test(low)) return ru ? 'Футбольный мяч' : 'Футбольний м’яч';
  return ru ? 'Футбольная экипировка' : 'Футбольна екіпіровка';
}

// Существительное типа товара (для строки «Тип» и начала описания).
function typeNoun(sectionSlug: string, name: string, ru: boolean): string {
  switch (sectionKind(sectionSlug, name)) {
    case 'turf':
      return ru ? 'Сороконожки (многошиповки)' : 'Сороконіжки (багатошиповки)';
    case 'indoor':
      return ru ? 'Футзалки (обувь для зала)' : 'Футзалки (взуття для залу)';
    case 'kids':
      return ru ? 'Детская футбольная обувь' : 'Дитяче футбольне взуття';
    case 'equip':
      return equipType(name, ru);
    default:
      return ru ? 'Футбольные бутсы' : 'Футбольні бутси';
  }
}

// ---- Тип подошвы → покрытие -------------------------------------------------
// Определяем по названию (маркировка производителя FG/AG/SG/MG/TF/IC), а для
// разделов «Сороконіжки» и «Футзалки» — по самому разделу (он курируется
// вручную и надёжнее, чем название). Если маркировки нет — НЕ угадываем.
export type SoleCode = 'FG' | 'AG' | 'SG' | 'MG' | 'FG/AG' | 'TF' | 'IC';

interface SoleInfo {
  code: SoleCode;
  full: string; // расшифровка маркировки
  surface: string; // покрытие (для таблицы характеристик)
  forText: string; // «для игры на …» (для описания)
}

const SOLE: Record<SoleCode, { full: string; uk: [string, string]; ru: [string, string] }> = {
  FG: {
    full: 'Firm Ground',
    uk: ['натуральний газон', 'для гри на натуральному газоні'],
    ru: ['натуральный газон', 'для игры на натуральном газоне'],
  },
  AG: {
    full: 'Artificial Ground',
    uk: ['штучна трава', 'для гри на штучній траві'],
    ru: ['искусственная трава', 'для игры на искусственной траве'],
  },
  SG: {
    full: 'Soft Ground',
    uk: ['м’який вологий натуральний газон', 'для гри на м’якому вологому газоні'],
    ru: ['мягкий влажный натуральный газон', 'для игры на мягком влажном газоне'],
  },
  MG: {
    full: 'Multi Ground',
    uk: ['натуральний газон і штучна трава', 'для гри на натуральному газоні та штучній траві'],
    ru: ['натуральный газон и искусственная трава', 'для игры на натуральном газоне и искусственной траве'],
  },
  'FG/AG': {
    full: 'Firm Ground / Artificial Ground',
    uk: ['натуральний газон і штучна трава', 'для гри на натуральному газоні та штучній траві'],
    ru: ['натуральный газон и искусственная трава', 'для игры на натуральном газоне и искусственной траве'],
  },
  TF: {
    full: 'Turf',
    uk: ['штучна трава, тверді та гумові майданчики', 'для штучної трави, твердих і гумових майданчиків'],
    ru: ['искусственная трава, твёрдые и резиновые площадки', 'для искусственной травы, твёрдых и резиновых площадок'],
  },
  IC: {
    full: 'Indoor Court',
    uk: ['зал, паркет, гладкі покриття', 'для гри в залі та на гладких покриттях'],
    ru: ['зал, паркет, гладкие покрытия', 'для игры в зале и на гладких покрытиях'],
  },
};

function soleFromName(name: string): SoleCode | null {
  const t = ` ${name.toUpperCase()} `;
  const has = (re: RegExp) => re.test(t);
  const fg = has(/[^A-Z]FG[^A-Z]/) || has(/FIRM GROUND/);
  const ag = has(/[^A-Z]AG[^A-Z]/) || has(/ARTIFICIAL GROUND/);
  if (fg && ag) return 'FG/AG';
  if (has(/[^A-Z]MG[^A-Z]/) || has(/MULTI GROUND/)) return 'MG';
  if (fg) return 'FG';
  if (ag) return 'AG';
  if (has(/[^A-Z]SG[^A-Z]/) || has(/SOFT GROUND/)) return 'SG';
  if (has(/[^A-Z]TF[^A-Z]/) || has(/TURF/)) return 'TF';
  if (has(/[^A-Z](IC|IN)[^A-Z]/) || has(/INDOOR/)) return 'IC';
  return null;
}

/** Тип подошвы товара (или null, если маркировки нет / это не обувь). */
export function productSole(p: { name: string; group: string | null }, sectionSlug: string, locale: Locale): SoleInfo | null {
  const text = `${p.group || ''} ${p.name}`;
  const kind = sectionKind(sectionSlug, text);
  if (kind === 'equip') return null;
  const kidsTurf = kind === 'kids' && /сороконіж|сороконож/i.test(text);
  const kidsIndoor = kind === 'kids' && /футзал/i.test(text);
  let code: SoleCode | null;
  if (kind === 'turf' || kidsTurf) code = 'TF';
  else if (kind === 'indoor' || kidsIndoor) code = 'IC';
  else code = soleFromName(text);
  if (!code) return null;
  const s = SOLE[code];
  const [surface, forText] = locale === 'ru' ? s.ru : s.uk;
  return { code, full: s.full, surface, forText };
}

// Короткое название типа (для <title>, если в названии товара его нет).
const TYPE_WORD = /бутс|сороконіж|сороконож|футзал|копочк|щитк|гетр|рукавиц|перчат|м.?яч|мяч|сумк|мішок|мешок|термо|шкарпет|носк/i;
function shortType(sectionSlug: string, text: string, ru: boolean): string | null {
  switch (sectionKind(sectionSlug, text)) {
    case 'turf':
      return ru ? 'Сороконожки' : 'Сороконіжки';
    case 'indoor':
      return 'Футзалки';
    case 'boots':
      return ru ? 'Бутсы' : 'Бутси';
    case 'kids':
      if (/сороконіж|сороконож/i.test(text)) return ru ? 'Детские сороконожки' : 'Дитячі сороконіжки';
      if (/футзал/i.test(text)) return ru ? 'Детские футзалки' : 'Дитячі футзалки';
      return ru ? 'Детские бутсы' : 'Дитячі бутси';
    default:
      return null; // экипировку не трогаем — названия там и так описательные
  }
}

/**
 * Заголовок товара для <title>: «тип + бренд + модель + маркировка».
 * Если тип уже есть в названии — название как есть (без дублей).
 */
export function productTitle(p: { name: string; group: string | null }, sectionSlug: string, locale: Locale): string {
  const name = localizeProductName(p.name, locale);
  if (TYPE_WORD.test(name)) return name;
  const type = shortType(sectionSlug, `${p.group || ''} ${p.name}`, locale === 'ru');
  return type ? `${type} ${name}` : name;
}

// Вводная фраза (намеренно НЕ повторяет бренд — он уже в названии). Опирается
// на реальный тип подошвы; без маркировки — нейтрально, без выдуманных свойств.
function kindLead(sectionSlug: string, name: string, ru: boolean, sole: SoleInfo | null): string {
  switch (sectionKind(sectionSlug, name)) {
    case 'turf':
      return ru
        ? `многошиповки (TF) ${sole?.forText ?? 'для искусственной травы и твёрдых покрытий'}`
        : `багатошиповки (TF) ${sole?.forText ?? 'для штучної трави та твердих покриттів'}`;
    case 'indoor':
      return ru
        ? `обувь с ровной резиновой подошвой (IC) ${sole?.forText ?? 'для игры в зале'}`
        : `взуття з рівною гумовою підошвою (IC) ${sole?.forText ?? 'для гри в залі'}`;
    case 'kids':
      return sole
        ? ru
          ? `детская футбольная обувь с подошвой ${sole.code} ${sole.forText}`
          : `дитяче футбольне взуття з підошвою ${sole.code} ${sole.forText}`
        : ru
          ? 'детская футбольная обувь для тренировок и игр'
          : 'дитяче футбольне взуття для тренувань та ігор';
    case 'equip':
      return equipType(name, ru).toLowerCase();
    default:
      return sole
        ? ru
          ? `футбольная обувь с подошвой ${sole.code} ${sole.forText}`
          : `футбольне взуття з підошвою ${sole.code} ${sole.forText}`
        : ru
          ? 'футбольная обувь с шипами для игры на газоне'
          : 'футбольне взуття з шипами для гри на газоні';
  }
}

export interface ProductSeoSpec {
  label: string;
  value: string;
}

export interface ProductSeoText {
  heading: string;
  paragraph: string;
  specs: ProductSeoSpec[];
}

/** Уникальное описание + характеристики товара для текущей локали. */
export function productSeoText(p: Product, sectionSlug: string, locale: Locale): ProductSeoText {
  const ru = locale === 'ru';
  const name = localizeProductName(p.name, locale);
  const brand = detectBrand(`${p.group || ''} ${p.name}`, sectionSlug);
  const type = typeNoun(sectionSlug, p.name, ru);
  const sole = productSole(p, sectionSlug, locale);
  const country = p.country ? localizeCountry(p.country, locale) : '';
  const inStock = p.sizes.filter((s) => s.inStock).map((s) => s.label);
  const sizesStr = inStock.join(', ');
  const price = formatUAH(p.finalPrice);

  // ---- Связный абзац (каждое предложение опирается на разные поля товара) ----
  const s: string[] = [];
  s.push(`${name} — ${kindLead(sectionSlug, p.name, ru, sole)}.`);
  if (p.code) {
    s.push(
      ru
        ? `Артикул — ${p.code}${country ? `, производство — ${country}` : ''}.`
        : `Артикул — ${p.code}${country ? `, виробництво — ${country}` : ''}.`,
    );
  } else if (country) {
    s.push(ru ? `Производство — ${country}.` : `Виробництво — ${country}.`);
  }
  if (sizesStr) {
    s.push(ru ? `Размеры в наличии: ${sizesStr}.` : `Розміри в наявності: ${sizesStr}.`);
  } else {
    s.push(
      ru
        ? 'Наличие размеров уточняйте у менеджера.'
        : 'Наявність розмірів уточнюйте у менеджера.',
    );
  }
  s.push(
    ru
      ? `Цена — ${price}. Доставка Новой Почтой по всей Украине, возможна оплата при получении.`
      : `Ціна — ${price}. Доставка Новою Поштою по всій Україні, можлива оплата при отриманні.`,
  );

  // ---- Таблица характеристик ----
  const specs: ProductSeoSpec[] = [];
  const add = (label: string, value?: string | null) => {
    const v = (value || '').trim();
    if (v) specs.push({ label, value: v });
  };
  add(ru ? 'Тип' : 'Тип', type);
  if (brand) add(ru ? 'Бренд' : 'Бренд', brand);
  if (p.group && p.group.trim() && p.group.trim().toLowerCase() !== (brand || '').toLowerCase())
    add(ru ? 'Модель' : 'Модель', p.group);
  if (sole) {
    add(ru ? 'Подошва' : 'Підошва', `${sole.code} (${sole.full})`);
    add(ru ? 'Покрытие' : 'Покриття', sole.surface);
  }
  add(ru ? 'Артикул' : 'Артикул', p.code);
  add(ru ? 'Страна' : 'Країна', country);
  add(ru ? 'Размеры в наличии' : 'Розміри в наявності', sizesStr);
  // Условия магазина (совпадают со страницами «Доставка» и «Гарантія»).
  add(
    ru ? 'Доставка' : 'Доставка',
    ru
      ? 'Новая Почта по всей Украине, 1–3 дня; заказы до 16:00 (Пн–Пт) отправляем в тот же день'
      : 'Нова Пошта по всій Україні, 1–3 дні; замовлення до 16:00 (Пн–Пт) відправляємо того ж дня',
  );
  add(
    ru ? 'Оплата' : 'Оплата',
    ru ? 'при получении (наложенный платёж) или предоплата на счёт' : 'при отриманні (накладений платіж) або передоплата на рахунок',
  );
  add(
    ru ? 'Обмен и возврат' : 'Обмін і повернення',
    ru ? 'в течение 14 дней с момента получения' : 'протягом 14 днів з моменту отримання',
  );

  return {
    heading: ru ? 'Описание товара' : 'Опис товару',
    paragraph: s.join(' '),
    specs,
  };
}

/** Короткая мета-описание товара: цена + покрытие + условия. */
export function productMetaDescription(p: Product, sectionSlug: string, locale: Locale): string {
  const ru = locale === 'ru';
  const name = productTitle(p, sectionSlug, locale);
  const sole = productSole(p, sectionSlug, locale);
  const price = formatUAH(p.finalPrice);
  const cover = sole ? (ru ? ` Покрытие: ${sole.surface}.` : ` Покриття: ${sole.surface}.`) : '';
  return ru
    ? `${name} — ${price}.${cover} Размеры в наличии, доставка Новой Почтой 1–3 дня, обмен и возврат 14 дней.`
    : `${name} — ${price}.${cover} Розміри в наявності, доставка Новою Поштою 1–3 дні, обмін і повернення 14 днів.`;
}
