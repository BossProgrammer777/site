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

/** Бренд товара или null. Для разделов nb-* всегда null (без бренда). */
export function detectBrand(text: string, sectionSlug = ''): string | null {
  if (sectionSlug.startsWith('nb-')) return null;
  const norm = normalize(text);
  for (const [re, name] of BRAND_RULES) if (re.test(text) || re.test(norm)) return name;
  return null;
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
