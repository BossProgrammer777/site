// ---------------------------------------------------------------------------
// SEO для посадочных страниц: копирайт категорий, брендов и генераторы
// микроразметки (JSON-LD). Язык — украинский (приоритетная локаль).
// ---------------------------------------------------------------------------

import { Product } from './types';
import { SITE_NAME, siteUrl } from './site';
import { PHONES, SOCIALS } from './contacts';
import { productImageSrc } from './img';
import type { Locale } from './i18n';

type Loc = Record<Locale, string>;
type LocArr = Record<Locale, string[]>;

export interface CategorySeo {
  /** URL-слаг = слаг раздела каталога. */
  slug: string;
  h1: Loc;
  title: Loc;
  description: Loc;
  keywords: LocArr;
  intro: Loc;
}

/** Плоский локализованный копирайт категории. */
export interface CategoryCopy {
  slug: string;
  h1: string;
  title: string;
  description: string;
  keywords: string[];
  intro: string;
}

// Посадочные категории (5 основных, товар под них реально есть).
export const CATEGORY_SEO: CategorySeo[] = [
  {
    slug: 'butsy',
    h1: { uk: 'Футбольні бутси', ru: 'Футбольные бутсы' },
    title: {
      uk: 'Футбольні бутси — купити в Україні | Bootsbaza',
      ru: 'Футбольные бутсы — купить в Украине | Bootsbaza',
    },
    description: {
      uk: 'Футбольні бутси Nike, Adidas, Puma та інших брендів. Актуальні розміри й наявність, ціни, доставка Новою Поштою по всій Україні.',
      ru: 'Футбольные бутсы Nike, Adidas, Puma и других брендов. Актуальные размеры и наличие, цены, доставка Новой Почтой по всей Украине.',
    },
    keywords: {
      uk: ['футбольні бутси', 'купити бутси', 'бутси Nike', 'бутси Adidas', 'бутси ціна'],
      ru: ['футбольные бутсы', 'купить бутсы', 'бутсы Nike', 'бутсы Adidas', 'бутсы цена'],
    },
    intro: {
      uk: 'Футбольні бутси (FG) — взуття для гри на натуральних та комбінованих газонах. У каталозі — брендові моделі Nike, Adidas, Puma та доступні варіанти без бренду. Розміри й наявність оновлюються автоматично, доставка по всій Україні «Новою Поштою».',
      ru: 'Футбольные бутсы (FG) — обувь для игры на натуральных и комбинированных газонах. В каталоге — брендовые модели Nike, Adidas, Puma и доступные варианты без бренда. Размеры и наличие обновляются автоматически, доставка по всей Украине «Новой Почтой».',
    },
  },
  {
    slug: 'sorokonizhky',
    h1: { uk: 'Сороконіжки (багатошиповки)', ru: 'Сороконожки (многошиповки)' },
    title: {
      uk: 'Сороконіжки — багатошиповки, купити | Bootsbaza',
      ru: 'Сороконожки — многошиповки, купить | Bootsbaza',
    },
    description: {
      uk: 'Футбольні сороконіжки (багатошиповки) для штучної трави та жорстких покриттів. Бренди й бюджетні моделі, актуальні розміри, доставка по Україні.',
      ru: 'Футбольные сороконожки (многошиповки) для искусственной травы и жёстких покрытий. Бренды и бюджетные модели, актуальные размеры, доставка по Украине.',
    },
    keywords: {
      uk: ['сороконіжки', 'багатошиповки', 'сороконіжки для штучної трави', 'купити сороконіжки'],
      ru: ['сороконожки', 'многошиповки', 'сороконожки для искусственной травы', 'купить сороконожки'],
    },
    intro: {
      uk: 'Сороконіжки (багатошиповки, TF) — універсальне взуття для штучної трави та твердих покриттів. Підходять для тренувань і аматорського футболу. Великий вибір розмірів, брендові та бюджетні моделі, доставка «Новою Поштою» по Україні.',
      ru: 'Сороконожки (многошиповки, TF) — универсальная обувь для искусственной травы и твёрдых покрытий. Подходят для тренировок и любительского футбола. Большой выбор размеров, брендовые и бюджетные модели, доставка «Новой Почтой» по Украине.',
    },
  },
  {
    slug: 'futzalky',
    h1: { uk: 'Футзалки', ru: 'Футзалки' },
    title: {
      uk: 'Футзалки — взуття для залу, купити | Bootsbaza',
      ru: 'Футзалки — обувь для зала, купить | Bootsbaza',
    },
    description: {
      uk: 'Футзалки для гри в залі: Nike, Adidas та бюджетні моделі. Актуальна наявність і розміри, ціни, доставка Новою Поштою по Україні.',
      ru: 'Футзалки для игры в зале: Nike, Adidas и бюджетные модели. Актуальное наличие и размеры, цены, доставка Новой Почтой по Украине.',
    },
    keywords: {
      uk: ['футзалки', 'взуття для залу', 'футзальне взуття', 'купити футзалки'],
      ru: ['футзалки', 'обувь для зала', 'футзальная обувь', 'купить футзалки'],
    },
    intro: {
      uk: 'Футзалки (IC) — взуття з рівною підошвою для гри у залі та на паркеті. У наявності моделі відомих брендів і доступні варіанти. Актуальні розміри, ціни та швидка доставка «Новою Поштою» по всій Україні.',
      ru: 'Футзалки (IC) — обувь с ровной подошвой для игры в зале и на паркете. В наличии модели известных брендов и доступные варианты. Актуальные размеры, цены и быстрая доставка «Новой Почтой» по всей Украине.',
    },
  },
  {
    slug: 'dytiache-vzuttia',
    h1: { uk: 'Дитяче футбольне взуття', ru: 'Детская футбольная обувь' },
    title: {
      uk: 'Дитячі бутси, сороконіжки, футзалки | Bootsbaza',
      ru: 'Детские бутсы, сороконожки, футзалки | Bootsbaza',
    },
    description: {
      uk: 'Дитяче футбольне взуття: бутси, сороконіжки, футзалки. Розміри на дітей, актуальна наявність, доставка Новою Поштою по всій Україні.',
      ru: 'Детская футбольная обувь: бутсы, сороконожки, футзалки. Размеры на детей, актуальное наличие, доставка Новой Почтой по всей Украине.',
    },
    keywords: {
      uk: ['дитячі бутси', 'футбольне взуття для дітей', 'дитячі сороконіжки', 'дитячі футзалки'],
      ru: ['детские бутсы', 'футбольная обувь для детей', 'детские сороконожки', 'детские футзалки'],
    },
    intro: {
      uk: 'Дитяче футбольне взуття для юних футболістів: бутси, сороконіжки та футзалки у дитячих розмірах. Зручні та легкі моделі для тренувань і матчів. Допоможемо підібрати розмір за розмірною сіткою, доставка по Україні.',
      ru: 'Детская футбольная обувь для юных футболистов: бутсы, сороконожки и футзалки в детских размерах. Удобные и лёгкие модели для тренировок и матчей. Поможем подобрать размер по размерной сетке, доставка по Украине.',
    },
  },
  {
    slug: 'ekipiruvannia',
    h1: { uk: 'Футбольна екіпіровка', ru: 'Футбольная экипировка' },
    title: {
      uk: 'Футбольна екіпіровка — купити | Bootsbaza',
      ru: 'Футбольная экипировка — купить | Bootsbaza',
    },
    description: {
      uk: 'Футбольна екіпіровка: гетри, щитки, воротарські рукавиці, м’ячі, термобілизна, сумки. Актуальна наявність і доставка по Україні.',
      ru: 'Футбольная экипировка: гетры, щитки, вратарские перчатки, мячи, термобельё, сумки. Актуальное наличие и доставка по Украине.',
    },
    keywords: {
      uk: ['футбольна екіпіровка', 'воротарські рукавиці', 'футбольні щитки', 'футбольні гетри', 'футбольні м’ячі'],
      ru: ['футбольная экипировка', 'вратарские перчатки', 'футбольные щитки', 'футбольные гетры', 'футбольные мячи'],
    },
    intro: {
      uk: 'Усе для гри та тренувань: футбольні гетри, щитки, воротарські рукавиці, м’ячі, термобілизна та сумки. Екіпіровка для аматорів, професіоналів і дитячих команд. Актуальна наявність, доставка «Новою Поштою» по всій Україні.',
      ru: 'Всё для игры и тренировок: футбольные гетры, щитки, вратарские перчатки, мячи, термобельё и сумки. Экипировка для любителей, профессионалов и детских команд. Актуальное наличие, доставка «Новой Почтой» по всей Украине.',
    },
  },
];

export function getCategorySeo(slug: string): CategorySeo | undefined {
  return CATEGORY_SEO.find((c) => c.slug === slug);
}
export function categoryLandingSlugs(): string[] {
  return CATEGORY_SEO.map((c) => c.slug);
}

/** Плоский копирайт категории под локаль. */
export function categoryCopy(slug: string, locale: Locale): CategoryCopy | undefined {
  const c = getCategorySeo(slug);
  if (!c) return undefined;
  return {
    slug: c.slug,
    h1: c.h1[locale],
    title: c.title[locale],
    description: c.description[locale],
    keywords: c.keywords[locale],
    intro: c.intro[locale],
  };
}

/** SEO-копирайт для брендовой посадочной («Бутси Nike» и т.п.). */
export function brandCategorySeo(cat: CategoryCopy, brand: string, locale: Locale) {
  const base = cat.h1;
  if (locale === 'ru') {
    return {
      h1: `${base} ${brand}`,
      title: `${base} ${brand} — купить в Украине | ${SITE_NAME}`.slice(0, 60),
      description:
        `${base} ${brand}: актуальные модели, размеры и наличие. Цены, оплата при получении, ` +
        `доставка Новой Почтой по всей Украине. Заказывайте в ${SITE_NAME}.`,
      intro:
        `${base} ${brand} в наличии. Выбирайте нужную модель и размер — наличие обновляется ` +
        `автоматически. Доставка «Новой Почтой» по всей Украине, оплата при получении.`,
    };
  }
  return {
    h1: `${base} ${brand}`,
    title: `${base} ${brand} — купити в Україні | ${SITE_NAME}`.slice(0, 60),
    description:
      `${base} ${brand}: актуальні моделі, розміри та наявність. Ціни, оплата при отриманні, ` +
      `доставка Новою Поштою по всій Україні. Замовляйте у ${SITE_NAME}.`,
    intro:
      `${base} ${brand} у наявності. Обирайте потрібну модель і розмір — наявність оновлюється ` +
      `автоматично. Доставка «Новою Поштою» по всій Україні, оплата при отриманні.`,
  };
}

// ---------------- JSON-LD ---------------------------------------------------
export function organizationJsonLd() {
  const base = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: base,
    logo: `${base}/logo.svg`,
    foundingDate: '2018',
    description:
      'Інтернет-магазин футбольного взуття та екіпіровки з 2018 року. Маємо власну аматорську команду, що виступає на турнірах Харкова.',
    areaServed: 'UA',
    contactPoint: PHONES.map((p) => ({
      '@type': 'ContactPoint',
      telephone: p.href.replace('tel:', ''),
      contactType: 'sales',
      areaServed: 'UA',
      availableLanguage: ['uk', 'ru'],
    })),
    sameAs: SOCIALS.map((s) => s.href),
  };
}

export function websiteJsonLd() {
  const base = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: base,
    inLanguage: 'uk',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${base}/catalog?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function productJsonLd(p: Product, url: string, brand: string | null) {
  const base = siteUrl();
  // Абсолютный URL картинки: productImageSrc даёт /photos/… либо /api/img?src=…
  const image = `${base}${productImageSrc(p.image)}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: [image],
    sku: p.code || p.id,
    ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
    ...(p.country ? { countryOfOrigin: p.country } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'UAH',
      price: p.finalPrice,
      availability: p.anyInStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
  };
}

export function articleJsonLd(a: {
  title: string;
  description: string;
  date: string;
  url: string;
}) {
  const base = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.title,
    description: a.description,
    datePublished: a.date,
    dateModified: a.date,
    inLanguage: 'uk',
    mainEntityOfPage: a.url,
    image: [`${base}/logo.svg`],
    author: { '@type': 'Organization', name: SITE_NAME, url: base },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${base}/logo.svg` },
    },
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

/** Готовый <script> тег с JSON-LD (строкой) для вставки в JSX. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
