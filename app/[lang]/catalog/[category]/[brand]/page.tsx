import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/cache';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CatalogBrowser } from '@/components/CatalogBrowser';
import { getCategorySeo, brandCategorySeo, breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';
import { brandFromSlug, detectBrand } from '@/lib/brand';
import { siteUrl } from '@/lib/site';
import { altMeta, Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

// Есть ли товары этого бренда в этом разделе (чтобы не плодить пустые страницы).
async function brandHasProducts(sectionSlug: string, brand: string): Promise<boolean> {
  const catalog = await getCatalog();
  const section = catalog.sections.find((s) => s.slug === sectionSlug);
  if (!section) return false;
  return section.products.some(
    (p) => detectBrand(`${p.group || ''} ${p.name}`, sectionSlug) === brand,
  );
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale; category: string; brand: string };
}): Promise<Metadata> {
  const cat = getCategorySeo(params.category);
  const brand = brandFromSlug(params.brand);
  if (!cat || !brand) return { title: 'Сторінку не знайдено' };
  const seo = brandCategorySeo(cat, brand);
  const alt = altMeta(params.lang, `/catalog/${cat.slug}/${params.brand}`);
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: alt,
    openGraph: { title: seo.title, description: seo.description, url: alt.canonical, type: 'website' },
  };
}

export default async function BrandCategoryPage({
  params,
}: {
  params: { category: string; brand: string };
}) {
  const cat = getCategorySeo(params.category);
  const brand = brandFromSlug(params.brand);
  if (!cat || !brand) notFound();
  if (!(await brandHasProducts(cat.slug, brand))) notFound();

  const seo = brandCategorySeo(cat, brand);
  const catalog = await getCatalog();
  const base = siteUrl();
  const crumbs = breadcrumbJsonLd([
    { name: 'Головна', url: `${base}/` },
    { name: 'Каталог', url: `${base}/catalog` },
    { name: cat.h1, url: `${base}/catalog/${cat.slug}` },
    { name: brand, url: `${base}/catalog/${cat.slug}/${params.brand}` },
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm [color:#7d8f83]">
          <Link href="/" className="hover:text-brand">
            Головна
          </Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-brand">
            Каталог
          </Link>
          <span>/</span>
          <Link href={`/catalog/${cat.slug}`} className="hover:text-brand">
            {cat.h1}
          </Link>
          <span>/</span>
          <span className="[color:#c3d3c8]">{brand}</span>
        </nav>

        <h1 className="mb-3 text-2xl font-extrabold sm:text-3xl">{seo.h1}</h1>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed [color:#9fb3a6]">{seo.intro}</p>

        <CatalogBrowser
          sections={catalog.sections}
          initialSections={[cat.slug]}
          initialBrands={[brand]}
        />
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
    </>
  );
}
