import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/cache';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CatalogBrowser } from '@/components/CatalogBrowser';
import { getCategorySeo, categoryLandingSlugs, breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';
import { siteUrl } from '@/lib/site';
import { altMeta, localeHref, Locale } from '@/lib/i18n';
import { dict } from '@/lib/dictionaries';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return categoryLandingSlugs().map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale; category: string };
}): Promise<Metadata> {
  const seo = getCategorySeo(params.category);
  if (!seo) return { title: 'Категорію не знайдено' };
  const alt = altMeta(params.lang, `/catalog/${seo.slug}`);
  return {
    title: { absolute: seo.title },
    description: seo.description,
    keywords: seo.keywords,
    alternates: alt,
    openGraph: { title: seo.title, description: seo.description, url: alt.canonical, type: 'website' },
  };
}

export default async function CategoryPage({ params }: { params: { lang: Locale; category: string } }) {
  const seo = getCategorySeo(params.category);
  if (!seo) notFound();

  const catalog = await getCatalog();
  const base = siteUrl();
  const bc = dict[params.lang].breadcrumb;
  const lh = (p: string) => localeHref(params.lang, p);
  const crumbs = breadcrumbJsonLd([
    { name: bc.home, url: `${base}${lh('/')}` },
    { name: bc.catalog, url: `${base}${lh('/catalog')}` },
    { name: seo.h1, url: `${base}${lh(`/catalog/${seo.slug}`)}` },
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm [color:#7d8f83]">
          <Link href={lh('/')} className="hover:text-brand">
            {bc.home}
          </Link>
          <span>/</span>
          <Link href={lh('/catalog')} className="hover:text-brand">
            {bc.catalog}
          </Link>
          <span>/</span>
          <span className="[color:#c3d3c8]">{seo.h1}</span>
        </nav>

        <h1 className="mb-3 text-2xl font-extrabold sm:text-3xl">{seo.h1}</h1>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed [color:#9fb3a6]">{seo.intro}</p>

        <CatalogBrowser sections={catalog.sections} initialSections={[seo.slug]} />
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
    </>
  );
}
