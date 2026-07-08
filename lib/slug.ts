// Транслитерация кириллицы в латиницу + slug для читаемых URL товара.

const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z',
  и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ь: '', ю: 'iu', я: 'ia', ъ: '', ы: 'y', э: 'e', ё: 'e',
};

export function translit(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => (ch in MAP ? MAP[ch] : ch))
    .join('');
}

export function slugify(text: string): string {
  return translit(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Читаемый slug товара: «назва-код». */
export function productSlug(name: string, code: string): string {
  const base = slugify(name);
  const c = slugify(code);
  return c ? `${base}-${c}` : base;
}
