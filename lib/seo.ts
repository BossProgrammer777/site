// ---------------------------------------------------------------------------
// SEO для посадочных страниц: копирайт категорий, брендов и генераторы
// микроразметки (JSON-LD). Язык — украинский (приоритетная локаль).
// ---------------------------------------------------------------------------

import { Product } from './types';
import { SITE_NAME, siteUrl } from './site';
import { PHONES, INSTAGRAM } from './contacts';
import { productImageSrc } from './img';

export interface CategorySeo {
  /** URL-слаг = слаг раздела каталога. */
  slug: string;
  /** Заголовок H1 на странице. */
  h1: string;
  title: string;
  description: string;
  keywords: string[];
  /** Вводный SEO-текст (виден пользователю, помогает ранжированию). */
  intro: string;
}

// Посадочные категории (5 основных, товар под них реально есть).
export const CATEGORY_SEO: CategorySeo[] = [
  {
    slug: 'butsy',
    h1: 'Футбольні бутси',
    title: 'Футбольні бутси — купити в Україні | Bootsbaza',
    description:
      'Футбольні бутси Nike, Adidas, Puma та інших брендів. Актуальні розміри й наявність, ціни, доставка Новою Поштою по всій Україні.',
    keywords: ['футбольні бутси', 'купити бутси', 'бутси Nike', 'бутси Adidas', 'бутси ціна'],
    intro:
      'Футбольні бутси (FG) — взуття для гри на натуральних та комбінованих газонах. У каталозі — брендові моделі Nike, Adidas, Puma та доступні варіанти без бренду. Розміри й наявність оновлюються автоматично, доставка по всій Україні «Новою Поштою».',
  },
  {
    slug: 'sorokonizhky',
    h1: 'Сороконіжки (багатошиповки)',
    title: 'Сороконіжки — багатошиповки, купити | Bootsbaza',
    description:
      'Футбольні сороконіжки (багатошиповки) для штучної трави та жорстких покриттів. Бренди й бюджетні моделі, актуальні розміри, доставка по Україні.',
    keywords: ['сороконіжки', 'багатошиповки', 'сороконіжки для штучної трави', 'купити сороконіжки'],
    intro:
      'Сороконіжки (багатошиповки, TF) — універсальне взуття для штучної трави та твердих покриттів. Підходять для тренувань і аматорського футболу. Великий вибір розмірів, брендові та бюджетні моделі, доставка «Новою Поштою» по Україні.',
  },
  {
    slug: 'futzalky',
    h1: 'Футзалки',
    title: 'Футзалки — взуття для залу, купити | Bootsbaza',
    description:
      'Футзалки для гри в залі: Nike, Adidas та бюджетні моделі. Актуальна наявність і розміри, ціни, доставка Новою Поштою по Україні.',
    keywords: ['футзалки', 'взуття для залу', 'футзальне взуття', 'купити футзалки'],
    intro:
      'Футзалки (IC) — взуття з рівною підошвою для гри у залі та на паркеті. У наявності моделі відомих брендів і доступні варіанти. Актуальні розміри, ціни та швидка доставка «Новою Поштою» по всій Україні.',
  },
  {
    slug: 'dytiache-vzuttia',
    h1: 'Дитяче футбольне взуття',
    title: 'Дитячі бутси, сороконіжки, футзалки | Bootsbaza',
    description:
      'Дитяче футбольне взуття: бутси, сороконіжки, футзалки. Розміри на дітей, актуальна наявність, доставка Новою Поштою по всій Україні.',
    keywords: ['дитячі бутси', 'футбольне взуття для дітей', 'дитячі сороконіжки', 'дитячі футзалки'],
    intro:
      'Дитяче футбольне взуття для юних футболістів: бутси, сороконіжки та футзалки у дитячих розмірах. Зручні та легкі моделі для тренувань і матчів. Допоможемо підібрати розмір за розмірною сіткою, доставка по Україні.',
  },
  {
    slug: 'ekipiruvannia',
    h1: 'Футбольна екіпіровка',
    title: 'Футбольна екіпіровка — купити | Bootsbaza',
    description:
      'Футбольна екіпіровка: гетри, щитки, воротарські рукавиці, м’ячі, термобілизна, сумки. Актуальна наявність і доставка по Україні.',
    keywords: ['футбольна екіпіровка', 'воротарські рукавиці', 'футбольні щитки', 'футбольні гетри', 'футбольні м’ячі'],
    intro:
      'Усе для гри та тренувань: футбольні гетри, щитки, воротарські рукавиці, м’ячі, термобілизна та сумки. Екіпіровка для аматорів, професіоналів і дитячих команд. Актуальна наявність, доставка «Новою Поштою» по всій Україні.',
  },
];

export function getCategorySeo(slug: string): CategorySeo | undefined {
  return CATEGORY_SEO.find((c) => c.slug === slug);
}
export function categoryLandingSlugs(): string[] {
  return CATEGORY_SEO.map((c) => c.slug);
}

/** SEO-копирайт для брендовой посадочной («Бутси Nike» и т.п.). */
export function brandCategorySeo(cat: CategorySeo, brand: string) {
  const base = cat.h1;
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
    contactPoint: PHONES.map((p) => ({
      '@type': 'ContactPoint',
      telephone: p.href.replace('tel:', ''),
      contactType: 'sales',
      areaServed: 'UA',
      availableLanguage: ['uk', 'ru'],
    })),
    sameAs: [INSTAGRAM],
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
