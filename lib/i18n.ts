// ---------------------------------------------------------------------------
// Базовая i18n-инфраструктура (без внешних зависимостей).
//  - UA — локаль по умолчанию, живёт на КОРНЕ (без префикса): /catalog.
//  - RU — под префиксом /ru: /ru/catalog.
// Существующие UA-URL не меняются → позиции в поиске сохраняются.
// ---------------------------------------------------------------------------

import { siteUrl } from './site';

export const LOCALES = ['uk', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];
export const defaultLocale: Locale = 'uk';

export function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}

/** Префикс URL для локали: uk → '' (корень), ru → '/ru'. */
export function localePrefix(l: Locale): string {
  return l === defaultLocale ? '' : `/${l}`;
}

/**
 * Локализованный href для пути приложения (path начинается с '/').
 * Внешние ссылки (http…, tel:, mailto:) возвращаются как есть.
 */
export function localeHref(l: Locale, path: string): string {
  if (!path.startsWith('/')) return path;
  const clean = path === '/' ? '' : path;
  return `${localePrefix(l)}${clean}` || '/';
}

/**
 * Метаданные alternates (canonical + hreflang) для страницы.
 * path — «чистый» путь без локали, напр. '/catalog/butsy' или '/'.
 */
export function altMeta(locale: Locale, path: string) {
  const base = siteUrl();
  const clean = path === '/' ? '' : path;
  const uaUrl = `${base}${clean || '/'}`;
  const ruUrl = `${base}/ru${clean}`;
  return {
    canonical: locale === 'ru' ? ruUrl : uaUrl,
    languages: {
      'uk-UA': uaUrl,
      'ru-UA': ruUrl,
      'x-default': uaUrl,
    },
  };
}
