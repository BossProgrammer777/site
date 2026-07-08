import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/cache';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticPages = ['', '/catalog', '/delivery', '/warranty', '/offer', '/contacts', '/cart'].map(
    (path) => ({ url: `${base}${path}`, lastModified: now }),
  );

  let products: MetadataRoute.Sitemap = [];
  try {
    const catalog = await getCatalog();
    products = catalog.sections.flatMap((s) =>
      s.products.map((p) => ({
        url: `${base}/product/${encodeURIComponent(p.slug)}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
      })),
    );
  } catch {
    /* без товаров — только статические */
  }

  return [...staticPages, ...products];
}
