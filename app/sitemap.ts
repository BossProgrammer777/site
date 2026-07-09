import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/cache';
import { siteUrl } from '@/lib/site';
import { categoryLandingSlugs, getCategorySeo } from '@/lib/seo';
import { BRAND_LANDINGS, detectBrand } from '@/lib/brand';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticPages = ['', '/catalog', '/delivery', '/warranty', '/offer', '/contacts', '/cart'].map(
    (path) => ({ url: `${base}${path}`, lastModified: now }),
  );

  // Посадочные категории.
  const categoryPages: MetadataRoute.Sitemap = categoryLandingSlugs().map((slug) => ({
    url: `${base}/catalog/${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
  }));

  let products: MetadataRoute.Sitemap = [];
  let brandPages: MetadataRoute.Sitemap = [];
  try {
    const catalog = await getCatalog();
    products = catalog.sections.flatMap((s) =>
      s.products.map((p) => ({
        url: `${base}/product/${encodeURIComponent(p.slug)}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
      })),
    );

    // Брендовые посадочные — только для непустых пар (категория × бренд).
    for (const catSlug of categoryLandingSlugs()) {
      if (!getCategorySeo(catSlug)) continue;
      const section = catalog.sections.find((s) => s.slug === catSlug);
      if (!section) continue;
      for (const b of BRAND_LANDINGS) {
        const has = section.products.some(
          (p) => detectBrand(`${p.group || ''} ${p.name}`, catSlug) === b.name,
        );
        if (has)
          brandPages.push({
            url: `${base}/catalog/${catSlug}/${b.slug}`,
            lastModified: now,
            changeFrequency: 'daily' as const,
          });
      }
    }
  } catch {
    /* без товаров — только статические */
  }

  return [...staticPages, ...categoryPages, ...brandPages, ...products];
}
