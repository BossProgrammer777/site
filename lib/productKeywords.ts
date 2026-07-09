// ---------------------------------------------------------------------------
// Ключевые слова для <meta keywords> страницы товара (по локали).
// Бренд + кириллические синонимы, тип по разделу, общефутбольные, страна.
// ---------------------------------------------------------------------------

import { Product } from './types';
import { detectBrand } from './brand';
import type { Locale } from './i18n';

// Кириллические синонимы латинских брендов (для семантики поиска на RU).
const BRAND_SYN: Record<string, string[]> = {
  Nike: ['найк'],
  Adidas: ['адидас', 'адідас'],
  Puma: ['пума'],
  'New Balance': ['нью баланс'],
  Mizuno: ['мизуно'],
  Joma: ['джома'],
  Kelme: ['кельме'],
  Umbro: ['умбро'],
  Nivia: ['нивия'],
};

type Kind = 'boots' | 'turf' | 'indoor' | 'kids' | 'equip';

function sectionKind(sectionSlug: string): Kind {
  if (sectionSlug === 'sorokonizhky') return 'turf';
  if (sectionSlug === 'futzalky') return 'indoor';
  if (sectionSlug === 'dytiache-vzuttia' || sectionSlug === 'nb-dytiache-vzuttia') return 'kids';
  if (sectionSlug === 'ekipiruvannia' || sectionSlug === 'nb-ekipiruvannia') return 'equip';
  return 'boots'; // butsy, nb-vzuttia
}

function equipKw(name: string, locale: Locale): string[] {
  const low = name.toLowerCase();
  const ru = locale === 'ru';
  if (/гетр|носк|гольф/.test(low)) return ru ? ['гетры', 'футбольные гетры', 'гольфы'] : ['гетри', 'футбольні гетри', 'гольфи'];
  if (/щитк|захист гоміл/.test(low)) return ru ? ['щитки', 'футбольные щитки', 'защита голени'] : ['щитки', 'футбольні щитки', 'захист гомілки'];
  if (/воротар|вратар|рукавиц|перчатк/.test(low)) return ru ? ['вратарские перчатки', 'перчатки вратаря'] : ['воротарські рукавиці', 'рукавиці воротаря'];
  if (/терм|компрес|білизн|белье/.test(low)) return ru ? ['термобельё', 'компрессионное бельё'] : ['термобілизна', 'компресійна білизна'];
  if (/сумк/.test(low)) return ru ? ['сумка для обуви', 'сумка для бутс'] : ['сумка для взуття', 'сумка для бутс'];
  if (/м.?яч|мяч|ball/.test(low)) return ru ? ['футбольный мяч', 'мяч для футбола'] : ['футбольний м’яч', 'м’яч для футболу'];
  return ru ? ['футбольная экипировка', 'экипировка для футбола'] : ['футбольна екіпіровка', 'екіпірування для футболу'];
}

function typeKw(sectionSlug: string, name: string, locale: Locale): string[] {
  const kind = sectionKind(sectionSlug);
  const ru = locale === 'ru';
  switch (kind) {
    case 'turf':
      return ru
        ? ['сороконожки', 'многошиповки', 'футбольные сороконожки']
        : ['сороконіжки', 'багатошиповки', 'футбольні сороконіжки'];
    case 'indoor':
      return ru
        ? ['футзалки', 'обувь для зала', 'футзальная обувь']
        : ['футзалки', 'взуття для залу', 'футзальне взуття'];
    case 'kids':
      return ru
        ? ['детские бутсы', 'футбольная обувь для детей', 'детские сороконожки']
        : ['дитячі бутси', 'футбольне взуття для дітей', 'дитячі сороконіжки'];
    case 'equip':
      return equipKw(name, locale);
    default:
      return ru
        ? ['бутсы', 'футбольные бутсы', 'копы', 'футбольная обувь']
        : ['бутси', 'футбольні бутси', 'копи', 'футбольне взуття'];
  }
}

/** Ключевые слова товара для текущей локали (для <meta keywords>). */
export function productKeywords(p: Product, sectionSlug: string, locale: Locale): string[] {
  const set = new Set<string>();
  const add = (v?: string | null) => {
    const t = (v || '').trim();
    if (t) set.add(t);
  };
  const ru = locale === 'ru';

  const brand = detectBrand(`${p.group || ''} ${p.name}`, sectionSlug);
  if (brand) {
    add(brand);
    if (ru) (BRAND_SYN[brand] || []).forEach(add);
  }
  add(p.group);

  const types = typeKw(sectionSlug, p.name, locale);
  types.forEach(add);
  if (brand) types.slice(0, 2).forEach((t) => add(`${t} ${ru ? (BRAND_SYN[brand]?.[0] ?? brand) : brand}`));

  add(ru ? 'футбол' : 'футбол');
  add(ru ? 'для футбола' : 'для футболу');
  add(p.country);
  add(ru ? 'купить' : 'купити');

  return Array.from(set).slice(0, 15);
}
