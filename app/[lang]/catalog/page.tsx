import type { Metadata } from 'next';
import { getPublicCatalog } from '@/lib/cache';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CatalogBrowser } from '@/components/CatalogBrowser';
import { altMeta, Locale } from '@/lib/i18n';

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
  searchParams,
}: {
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

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">Каталог</h1>
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
