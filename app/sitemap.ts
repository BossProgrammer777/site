import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/cache';
import { siteUrl } from '@/lib/site';
import { categoryLandingSlugs, getCategorySeo } from '@/lib/seo';
import { BRAND_LANDINGS, detectBrand } from '@/lib/brand';
import { BLOG } from '@/lib/blog';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  // Разворачивает «чистый» путь в записи для обеих локалей + hreflang-alternates.
  // Служебные страницы (корзина/чекаут/избранное) в карту не попадают.
  const entry = (
    path: string,
    lastModified: Date,
    changeFrequency?: 'daily' | 'weekly' | 'monthly',
  ): MetadataRoute.Sitemap => {
    const clean = path === '/' ? '' : path;
    const uaUrl = `${base}${clean || '/'}`;
    const ruUrl = `${base}/ru${clean}`;
    const languages = { 'uk-UA': uaUrl, 'ru-UA': ruUrl, 'x-default': uaUrl };
    return [
      { url: uaUrl, lastModified, changeFrequency, alternates: { languages } },
      { url: ruUrl, lastModified, changeFrequency, alternates: { languages } },
    ];
  };

  const out: MetadataRoute.Sitemap = [];

  // Статические (индексируемые) страницы.
  for (const p of ['', '/about', '/catalog', '/reviews', '/blog', '/delivery', '/warranty', '/offer', '/contacts']) {
    out.push(...entry(p, now));
  }

  // Посадочные категории.
  for (const slug of categoryLandingSlugs()) {
    out.push(...entry(`/catalog/${slug}`, now, 'daily'));
  }

  // Статьи блога.
  for (const a of BLOG) {
    out.push(...entry(`/blog/${a.slug}`, new Date(a.date), 'monthly'));
  }

  try {
    const catalog = await getCatalog();

    // Карточки товаров.
    for (const s of catalog.sections) {
      for (const p of s.products) {
        out.push(...entry(`/product/${encodeURIComponent(p.slug)}`, now, 'daily'));
      }
    }

    // Брендовые посадочные — только для непустых пар (категория × бренд).
    for (const catSlug of categoryLandingSlugs()) {
      if (!getCategorySeo(catSlug)) continue;
      const section = catalog.sections.find((s) => s.slug === catSlug);
      if (!section) continue;
      for (const b of BRAND_LANDINGS) {
        const has = section.products.some(
          (p) => detectBrand(`${p.group || ''} ${p.name}`, catSlug) === b.name,
        );
        if (has) out.push(...entry(`/catalog/${catSlug}/${b.slug}`, now, 'daily'));
      }
    }
  } catch {
    /* без товаров — только статические */
  }

  return out;
}
