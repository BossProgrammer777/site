import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/cache';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ProductDetail } from '@/components/ProductDetail';
import { formatUAH } from '@/lib/format';
import { siteUrl } from '@/lib/site';
import { getCategorySeo, breadcrumbJsonLd, productJsonLd, jsonLdScript } from '@/lib/seo';
import { detectBrand } from '@/lib/brand';
import { altMeta, Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale; id: string };
}): Promise<Metadata> {
  const key = decodeURIComponent(params.id);
  const catalog = await getCatalog();
  const product = catalog.sections
    .flatMap((s) => s.products)
    .find((p) => p.slug === key || p.id === key);
  if (!product) return { title: 'Товар не знайдено' };

  const description = `${product.name} — ${formatUAH(product.finalPrice)}. Розміри в наявності, розмірна сітка, доставка Новою Поштою.`;
  return {
    title: product.name,
    description,
    alternates: altMeta(params.lang, `/product/${encodeURIComponent(product.slug)}`),
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      images: [product.image || '/logo.svg'],
    },
    twitter: { card: 'summary_large_image', title: product.name, description },
  };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const key = decodeURIComponent(params.id);
  const catalog = await getCatalog();

  let found = null as
    | {
        product: (typeof catalog.sections)[number]['products'][number];
        sectionLabel: string;
        sectionSlug: string;
      }
    | null;
  for (const s of catalog.sections) {
    const p = s.products.find((x) => x.slug === key || x.id === key);
    if (p) {
      found = { product: p, sectionLabel: s.label, sectionSlug: s.slug };
      break;
    }
  }
  if (!found) notFound();

  const base = siteUrl();
  const { product, sectionLabel, sectionSlug } = found;
  const catSeo = getCategorySeo(sectionSlug);
  const catHref = catSeo ? `/catalog/${sectionSlug}` : '/catalog';
  const productUrl = `${base}/product/${encodeURIComponent(product.slug)}`;
  const brand = detectBrand(`${product.group || ''} ${product.name}`, sectionSlug);

  const crumbs = breadcrumbJsonLd([
    { name: 'Головна', url: `${base}/` },
    { name: 'Каталог', url: `${base}/catalog` },
    { name: sectionLabel, url: `${base}${catHref}` },
    { name: product.name, url: productUrl },
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm [color:#7d8f83]">
          <Link href="/" className="hover:text-brand">
            Головна
          </Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-brand">
            Каталог
          </Link>
          <span>/</span>
          <Link href={catHref} className="hover:text-brand">
            {sectionLabel}
          </Link>
        </nav>
        <ProductDetail product={product} />
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd(product, productUrl, brand)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
    </>
  );
}
