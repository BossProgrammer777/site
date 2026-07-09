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

  const staticPages = ['', '/about', '/catalog', '/blog', '/delivery', '/warranty', '/offer', '/contacts', '/cart'].map(
    (path) => ({ url: `${base}${path}`, lastModified: now }),
  );

  // Статьи блога.
  const blogPages: MetadataRoute.Sitemap = BLOG.map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: 'monthly' as const,
  }));

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

  return [...staticPages, ...categoryPages, ...blogPages, ...brandPages, ...products];
}
