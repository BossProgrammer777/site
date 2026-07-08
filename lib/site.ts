// Базовый URL сайта (для абсолютных ссылок в OpenGraph/sitemap).
// В проде задайте NEXT_PUBLIC_SITE_URL (напр. https://bootsbaza.com).
export function siteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export const SITE_NAME = 'Bootsbaza';
export const SITE_DESCRIPTION =
  'Інтернет-магазин футбольного взуття та екіпіровки: бутси, сороконіжки, футзалки, дитяче взуття. Актуальна наявність, доставка Новою Поштою.';
