import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicCatalog } from '@/lib/cache';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CatalogBrowser } from '@/components/CatalogBrowser';
import { altMeta, localeHref, Locale } from '@/lib/i18n';
import { categoryLandingSlugs } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  return {
    title: { absolute: 'Каталог футбольного взуття та екіпіровки | Bootsbaza' },
    description:
      'Каталог футбольного взуття та екіпіровки: бутси, сороконіжки, футзалки, дитяче взуття, гетри, щитки, м’ячі. Актуальні розміри й ціни, доставка по Україні.',
    alternates: altMeta(params.lang, '/catalog'),
  };
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: { lang: Locale };
  searchParams: {
    section?: string;
    cat?: string;
    brand?: string;
    model?: string;
    size?: string;
    country?: string;
    q?: string;
    pmin?: string;
    pmax?: string;
  };
}) {
  const catalog = await getPublicCatalog();
  const split = (v?: string) =>
    v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];

  // Быстрые ссылки на SEO-посадочные категорий (внутренняя перелинковка →
  // помогает индексации). Показываем только те, где реально есть товар.
  const landing = new Set(categoryLandingSlugs());
  const catLinks = catalog.sections
    .filter((s) => landing.has(s.slug) && s.products.length > 0)
    .map((s) => ({ slug: s.slug, label: s.label }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <h1 className="mb-4 text-2xl font-extrabold sm:text-3xl">Каталог</h1>

        {catLinks.length > 0 && (
          <nav className="mb-6 flex flex-wrap gap-2">
            {catLinks.map((c) => (
              <Link
                key={c.slug}
                href={localeHref(params.lang, `/catalog/${c.slug}`)}
                className="rounded-lg border border-ink-700 bg-ink-900 px-3.5 py-1.5 text-sm font-semibold text-brand transition hover:border-brand/50"
              >
                {c.label}
              </Link>
            ))}
          </nav>
        )}

        <CatalogBrowser
          sections={catalog.sections}
          initialSections={split(searchParams.section)}
          initialCats={split(searchParams.cat)}
          initialBrands={split(searchParams.brand)}
          initialModels={split(searchParams.model)}
          initialSizes={split(searchParams.size)}
          initialCountries={split(searchParams.country)}
          initialQuery={searchParams.q || ''}
          initialPriceFrom={searchParams.pmin ? Number(searchParams.pmin) : undefined}
          initialPriceTo={searchParams.pmax ? Number(searchParams.pmax) : undefined}
        />
      </main>
      <SiteFooter />
    </>
  );
}
