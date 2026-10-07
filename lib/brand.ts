// ---------------------------------------------------------------------------
// Единое определение бренда по названию/подкатегории товара + слаги брендов
// для посадочных страниц. Используется фидом Prom и SEO-страницами.
//  ВАЖНО: разделы «НБ …» (nb-*) = No Brand (безбрендовые копии) — там бренда нет.
// ---------------------------------------------------------------------------

const HOMOGLYPHS: Record<string, string> = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', х: 'x', і: 'i', у: 'y',
  к: 'k', м: 'm', н: 'n', т: 't', в: 'b',
};
function normalize(s: string): string {
  return s.toLowerCase().replace(/[аеорсхіукмнтв]/g, (ch) => HOMOGLYPHS[ch] || ch);
}

const BRAND_RULES: [RegExp, string][] = [
  [/new balance|нью ?баланс/i, 'New Balance'],
  [/nike|найк/i, 'Nike'],
  [/adidas|ад[іи]дас/i, 'Adidas'],
  [/puma|пума/i, 'Puma'],
  [/mizuno|м[іи]зуно/i, 'Mizuno'],
  [/joma|джома/i, 'Joma'],
  [/under armour|андер армор/i, 'Under Armour'],
  [/umbro|умбро/i, 'Umbro'],
  [/kelme|кельме/i, 'Kelme'],
  [/nivia|нівіа|нивия/i, 'Nivia'],
];

// Бренд по названию модели — когда в прайсе бренд не написан («Бутси F50 FG»,
// «Бутси Tiempo Legend 10 FG»). Только узнаваемые линейки (латиницей, целым словом).
// Спорные слова (Future, Ultra) — только для взуття, щоб не зачепити екіпіровку.
const FOOTWEAR_SECTIONS = new Set(['butsy', 'sorokonizhky', 'futzalky', 'dytiache-vzuttia']);
const MODEL_RULES: [RegExp, string, boolean][] = [
  [/\b(mercurial|superfly|vapor|phantom|tiempo|hypervenom|magista|lunar\s*gato|react\s*gato|street\s*gato|air\s*zoom|pro\s*combat)\b/i, 'Nike', false],
  [/\b(predator|f50|copa|crazyfast|speedportal|nemeziz|mundial)\b/i, 'Adidas', false],
  [/\b(morelia|monarcida)\b/i, 'Mizuno', false],
  [/\b(furon|tekela)\b/i, 'New Balance', false],
  [/\b(future|ultra)\b/i, 'Puma', true],
];

/** Бренд за назвою моделі (або null). Для nb-* — завжди null. */
export function modelBrand(text: string, sectionSlug = ''): string | null {
  if (sectionSlug.startsWith('nb-')) return null;
  for (const [re, name, footwearOnly] of MODEL_RULES) {
    if (footwearOnly && !FOOTWEAR_SECTIONS.has(sectionSlug)) continue;
    if (re.test(text)) return name;
  }
  return null;
}

/** Бренд товара или null. Для разделов nb-* всегда null (без бренда). */
export function detectBrand(text: string, sectionSlug = ''): string | null {
  if (sectionSlug.startsWith('nb-')) return null;
  const norm = normalize(text);
  for (const [re, name] of BRAND_RULES) if (re.test(text) || re.test(norm)) return name;
  return modelBrand(text, sectionSlug);
}

// Бренд, подтверждённый вручную для товаров, у которых в прайсе бренда нет ни в
// названии, ни в строке-группе. Ключ — «раздел:код». Используется только на
// странице товара (SEO-тексты, характеристики, Product JSON-LD); фильтры каталога
// и бренд-страницы по-прежнему опираются на detectBrand().
export const BRAND_BY_CODE: Record<string, string> = {
  'ekipiruvannia:1030': 'Nike', // Гетри (у прайсі назва без бренду; раніше «…Nike»)
};

/** Бренд товара: подтверждённый вручную (BRAND_BY_CODE) или определённый по тексту. */
export function productBrand(
  p: { code?: string | null; group: string | null; name: string },
  sectionSlug: string,
): string | null {
  if (sectionSlug.startsWith('nb-')) return null;
  const manual = p.code ? BRAND_BY_CODE[`${sectionSlug}:${p.code.trim()}`] : undefined;
  return manual ?? detectBrand(`${p.group || ''} ${p.name}`, sectionSlug);
}

// Бренды, под которые делаем отдельные посадочные страницы (slug ↔ назва).
export const BRAND_LANDINGS: { slug: string; name: string }[] = [
  { slug: 'nike', name: 'Nike' },
  { slug: 'adidas', name: 'Adidas' },
  { slug: 'puma', name: 'Puma' },
  { slug: 'new-balance', name: 'New Balance' },
];

export function brandFromSlug(slug: string): string | null {
  return BRAND_LANDINGS.find((b) => b.slug === slug)?.name ?? null;
}
export function brandSlug(name: string): string | null {
  return BRAND_LANDINGS.find((b) => b.name === name)?.slug ?? null;
}
