import type { Metadata } from 'next';
import { getCatalog } from '@/lib/cache';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CatalogBrowser } from '@/components/CatalogBrowser';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Каталог футбольного взуття та екіпіровки | Bootsbaza' },
  description:
    'Каталог футбольного взуття та екіпіровки: бутси, сороконіжки, футзалки, дитяче взуття, гетри, щитки, м’ячі. Актуальні розміри й ціни, доставка по Україні.',
  alternates: { canonical: `${siteUrl()}/catalog` },
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { section?: string; brand?: string; q?: string };
}) {
  const catalog = await getCatalog();
  const initialSections = searchParams.section ? [searchParams.section] : [];
  const initialBrands = searchParams.brand ? [searchParams.brand] : [];
  const initialQuery = searchParams.q || '';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">Каталог</h1>
        <CatalogBrowser
          sections={catalog.sections}
          initialSections={initialSections}
          initialBrands={initialBrands}
          initialQuery={initialQuery}
        />
      </main>
      <SiteFooter />
    </>
  );
}
