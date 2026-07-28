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

function sectionKind(sectionSlug: string): Kind {
  if (sectionSlug === 'sorokonizhky') return 'turf';
  if (sectionSlug === 'futzalky') return 'indoor';
  if (sectionSlug === 'dytiache-vzuttia' || sectionSlug === 'nb-dytiache-vzuttia') return 'kids';
  if (sectionSlug === 'ekipiruvannia' || sectionSlug === 'nb-ekipiruvannia') return 'equip';
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
  switch (sectionKind(sectionSlug)) {
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

// Вводная фраза-синоним (намеренно НЕ повторяет слово-категорию из названия
// товара и бренд — они уже есть в названии). Даёт назначение и уникальный текст.
function kindLead(sectionSlug: string, name: string, ru: boolean): string {
  switch (sectionKind(sectionSlug)) {
    case 'turf':
      return ru
        ? 'многошиповки для искусственных и твёрдых покрытий, резиновой крошки и жёстких полей'
        : 'багатошиповки для штучних і твердих покриттів, гумової крихти та жорстких полів';
    case 'indoor':
      return ru
        ? 'обувь для зала и ровных покрытий'
        : 'взуття для залу та рівних покриттів';
    case 'kids':
      return ru
        ? 'детская футбольная обувь для тренировок и игр'
        : 'дитяче футбольне взуття для тренувань та ігор';
    case 'equip':
      return equipType(name, ru).toLowerCase();
    default:
      return ru
        ? 'профессиональная футбольная обувь для игры на натуральном газоне'
        : 'професійне футбольне взуття для гри на натуральному газоні';
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
  const country = p.country ? localizeCountry(p.country, locale) : '';
  const inStock = p.sizes.filter((s) => s.inStock).map((s) => s.label);
  const sizesStr = inStock.join(', ');
  const price = formatUAH(p.finalPrice);

  // ---- Связный абзац (каждое предложение опирается на разные поля товара) ----
  const s: string[] = [];
  s.push(`${name} — ${kindLead(sectionSlug, p.name, ru)}.`);
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
  add(ru ? 'Артикул' : 'Артикул', p.code);
  add(ru ? 'Страна' : 'Країна', country);
  add(ru ? 'Размеры в наличии' : 'Розміри в наявності', sizesStr);

  return {
    heading: ru ? 'Описание товара' : 'Опис товару',
    paragraph: s.join(' '),
    specs,
  };
}
