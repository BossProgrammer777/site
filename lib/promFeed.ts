// ---------------------------------------------------------------------------
// Генерация товарного фида для Prom.ua (формат YML/Prom XML).
//  - Живьём из каталога: наши ЦЕНЫ С НАЦЕНКОЙ (дроп-цена наружу не идёт).
//  - Категории = разделы сайта.
//  - Автогенерация <keywords> (укр+рус синонимы, бренд, модель, размеры).
//  - SEO-описание в <description> + отдельные seo-поля.
// Prom настраивается на автоимпорт по ссылке на этот фид — обновляется сам.
// ---------------------------------------------------------------------------

import { Catalog, Product, Section } from './types';
import { SITE_NAME, siteUrl } from './site';
import { productImageSrc } from './img';
import { formatUAH } from './format';

// ---------------- бренды (лат. + кириллические синонимы для поиска) ----------
const BRANDS: { name: string; syn: string[] }[] = [
  { name: 'Nike', syn: ['найк', 'найки'] },
  { name: 'Adidas', syn: ['адідас', 'адидас'] },
  { name: 'Puma', syn: ['пума'] },
  { name: 'New Balance', syn: ['нью баланс', 'нью-баланс'] },
  { name: 'Mizuno', syn: ['мізуно', 'мизуно'] },
  { name: 'Joma', syn: ['джома'] },
  { name: 'Kelme', syn: ['кельме'] },
  { name: 'Jordan', syn: ['джордан'] },
  { name: 'Umbro', syn: ['умбро'] },
  { name: 'Nivia', syn: ['нівія', 'нивия'] },
  { name: 'Select', syn: ['селект'] },
  { name: 'Molten', syn: ['молтен'] },
  { name: 'Under Armour', syn: ['андер армор'] },
];

// Продавцы часто печатают латинские бренды с кириллическими «двойниками»
// (Аdidas, Nіke). Приводим кириллические омоглифы к латинице для распознавания.
const HOMOGLYPH: Record<string, string> = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', х: 'x', у: 'y', к: 'k',
  м: 'm', т: 't', н: 'h', в: 'b', і: 'i', ѕ: 's', ј: 'j',
};
function delatin(s: string): string {
  return s.toLowerCase().replace(/[а-яіѕј]/g, (c) => HOMOGLYPH[c] ?? c);
}

function detectBrand(text: string): { name: string; syn: string[] } | null {
  const low = delatin(text);
  for (const b of BRANDS) if (low.includes(b.name.toLowerCase())) return b;
  return null;
}

// ---------------- синонимы типа товара по разделу ---------------------------
// Возвращает набор ключевых фраз (укр+рус) под тип товара.
function typeKeywords(section: Section, name: string): string[] {
  const s = section.slug;
  const low = name.toLowerCase();
  const kids =
    s === 'dytiache-vzuttia' || s === 'nb-dytiache-vzuttia'
      ? ['дитячі', 'детские', 'для дітей']
      : [];

  if (s === 'butsy' || s === 'nb-vzuttia')
    return ['бутси', 'бутсы', 'копи', 'копочки', 'футбольні бутси', 'футбольная обувь', ...kids];
  if (s === 'sorokonizhky')
    return ['сороконіжки', 'сороконожки', 'багатошиповки', 'футбольні сороконіжки', ...kids];
  if (s === 'futzalky')
    return ['футзалки', 'зальники', 'взуття для залу', 'футзальне взуття', 'обувь для зала', ...kids];
  if (s === 'dytiache-vzuttia' || s === 'nb-dytiache-vzuttia')
    return ['дитячі бутси', 'детская футбольная обувь', 'футбольне взуття для дітей', ...kids];

  // Экипировка — уточняем по названию.
  if (/гетр|носки|гольф/i.test(low))
    return ['гетри', 'гетры', 'футбольні гетри', 'гольфи', 'носки футбольні'];
  if (/щитк|захист гоміл/i.test(low))
    return ['щитки', 'футбольні щитки', 'захист гомілки', 'щитки для футболу'];
  if (/воротар|вратар|рукавиц|перчатк/i.test(low))
    return ['воротарські рукавиці', 'вратарские перчатки', 'рукавиці воротаря', 'перчатки вратаря'];
  if (/терм|компрес|білизн|белье/i.test(low))
    return ['термобілизна', 'термобелье', 'компресійна білизна', 'футбольна білизна'];
  if (/сумк/i.test(low)) return ['сумка для взуття', 'сумка для бутс', 'сумка спортивна'];
  if (/м.?яч|мяч|ball/i.test(low)) return ['футбольний м’яч', 'мяч футбольный', 'м’яч для футболу'];
  if (/фіксатор|тейп/i.test(low)) return ['фіксатори', 'тейпи', 'спортивні фіксатори'];
  return ['футбольна екіпіровка', 'футбольне спорядження', 'екіпірування для футболу'];
}

// Доступные размеры товара (в наличии), как строка "39, 40, 41".
function availableSizes(p: Product): string[] {
  return p.sizes.filter((s) => s.inStock && s.label).map((s) => s.label);
}

// ---------------- ключевые слова для одного товара --------------------------
function buildKeywords(p: Product, section: Section): string {
  const set = new Set<string>();
  const add = (v?: string | null) => {
    const t = (v || '').trim();
    if (t) set.add(t);
  };

  const brand = detectBrand(`${p.name} ${p.group || ''}`);
  // Бренд + кириллические синонимы.
  if (brand) {
    add(brand.name);
    brand.syn.forEach(add);
  }
  // Модель/линейка (group), напр. «Nike Mercurial».
  add(p.group);
  // Бренд+модель как одна фраза уже в group; добавим «бренд + тип».
  const types = typeKeywords(section, p.name);
  types.forEach(add);
  if (brand) types.slice(0, 2).forEach((t) => add(`${t} ${brand.syn[0] || brand.name}`));

  // Общефутбольные.
  add('футбол');
  add('для футболу');

  // Размеры (люди ищут по размеру).
  const sizes = availableSizes(p);
  if (sizes.length) add(`розмір ${sizes.join(' ')}`);

  // Страна.
  add(p.country);

  // Коммерческие.
  add('купити');
  add('Україна');
  add('ціна');

  // Ограничиваем ~15 фразами, чтобы Prom не резал за переспам.
  return Array.from(set).slice(0, 15).join(', ');
}

// ---------------- SEO заголовок и описание ----------------------------------
function seoTitle(p: Product): string {
  return `${p.name} — купити в Україні, ціна ${formatUAH(p.finalPrice)} | ${SITE_NAME}`;
}

function seoDescriptionText(p: Product, section: Section): string {
  const sizes = availableSizes(p);
  const sizePart = sizes.length ? ` Наявні розміри: ${sizes.join(', ')}.` : '';
  const countryPart = p.country ? ` Країна виробник: ${p.country}.` : '';
  return (
    `${p.name} за ціною ${formatUAH(p.finalPrice)}.${sizePart}${countryPart} ` +
    `Актуальна наявність, доставка Новою Поштою по всій Україні, оплата при отриманні. ` +
    `Замовляйте ${section.label.toLowerCase()} у ${SITE_NAME}.`
  );
}

function descriptionHtml(p: Product, section: Section): string {
  const sizes = availableSizes(p);
  const rows: string[] = [];
  rows.push(`<h2>${escXml(p.name)}</h2>`);
  const meta: string[] = [];
  if (p.group) meta.push(`Модель: ${escXml(p.group)}`);
  if (p.country) meta.push(`Країна виробник: ${escXml(p.country)}`);
  if (sizes.length) meta.push(`Наявні розміри: ${escXml(sizes.join(', '))}`);
  if (meta.length) rows.push(`<ul><li>${meta.join('</li><li>')}</li></ul>`);
  rows.push(`<p>${escXml(seoDescriptionText(p, section))}</p>`);
  if (p.notes) rows.push(`<p>${escXml(p.notes)}</p>`);
  return rows.join('');
}

// ---------------- XML-экранирование ----------------------------------------
function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absImage(p: Product): string | null {
  if (!p.image) return null;
  const rel = productImageSrc(p.image); // /photos/... либо /api/img?src=...
  return `${siteUrl()}${rel}`;
}

// ---------------- сборка всего фида -----------------------------------------
export function buildPromXml(catalog: Catalog): string {
  const base = siteUrl();
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;

  // Категории = разделы. id по порядку.
  const catId = new Map<string, number>();
  const catXml: string[] = [];
  catalog.sections.forEach((sec, i) => {
    const id = i + 1;
    catId.set(sec.slug, id);
    catXml.push(`      <category id="${id}">${escXml(sec.label)}</category>`);
  });

  const offers: string[] = [];
  for (const section of catalog.sections) {
    const cid = catId.get(section.slug);
    for (const p of section.products) {
      const brand = detectBrand(`${p.name} ${p.group || ''}`);
      const img = absImage(p);
      const sizes = availableSizes(p);
      const lines: string[] = [];
      lines.push(`    <offer id="${escXml(p.id)}" available="${p.anyInStock ? 'true' : 'false'}">`);
      lines.push(`      <url>${base}/product/${encodeURIComponent(p.slug)}</url>`);
      lines.push(`      <name>${escXml(p.name)}</name>`);
      lines.push(`      <price>${p.finalPrice}</price>`);
      lines.push(`      <currencyId>UAH</currencyId>`);
      if (cid) lines.push(`      <categoryId>${cid}</categoryId>`);
      if (img) lines.push(`      <picture>${escXml(img)}</picture>`);
      if (brand) lines.push(`      <vendor>${escXml(brand.name)}</vendor>`);
      if (p.code) lines.push(`      <vendorCode>${escXml(p.code)}</vendorCode>`);
      if (p.country) lines.push(`      <country>${escXml(p.country)}</country>`);
      lines.push(`      <description><![CDATA[${descriptionHtml(p, section)}]]></description>`);
      lines.push(`      <keywords>${escXml(buildKeywords(p, section))}</keywords>`);
      // SEO-поля (подтянутся, если тариф Prom принимает их при импорте).
      lines.push(`      <seo_title>${escXml(seoTitle(p))}</seo_title>`);
      lines.push(
        `      <seo_description>${escXml(seoDescriptionText(p, section))}</seo_description>`,
      );
      if (sizes.length)
        lines.push(`      <param name="Розмір">${escXml(sizes.join(', '))}</param>`);
      if (p.country)
        lines.push(`      <param name="Країна виробник">${escXml(p.country)}</param>`);
      lines.push(`    </offer>`);
      offers.push(lines.join('\n'));
    }
  }

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<yml_catalog date="${date}">\n` +
    `  <shop>\n` +
    `    <name>${escXml(SITE_NAME)}</name>\n` +
    `    <company>${escXml(SITE_NAME)}</company>\n` +
    `    <url>${base}</url>\n` +
    `    <currencies>\n      <currency id="UAH" rate="1"/>\n    </currencies>\n` +
    `    <categories>\n${catXml.join('\n')}\n    </categories>\n` +
    `    <offers>\n${offers.join('\n')}\n    </offers>\n` +
    `  </shop>\n` +
    `</yml_catalog>\n`
  );
}
