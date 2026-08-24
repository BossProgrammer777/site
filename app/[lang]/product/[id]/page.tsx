import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicCatalog } from '@/lib/cache';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ProductDetail } from '@/components/ProductDetail';
import { ProductSeoContent } from '@/components/ProductSeoContent';
import { formatUAH } from '@/lib/format';
import { siteUrl } from '@/lib/site';
import { getCategorySeo, breadcrumbJsonLd, productJsonLd, jsonLdScript } from '@/lib/seo';
import { detectBrand } from '@/lib/brand';
import { altMeta, localeHref, Locale } from '@/lib/i18n';
import { dict } from '@/lib/dictionaries';
import { localizeProductName } from '@/lib/productL10n';
import { productKeywords } from '@/lib/productKeywords';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale; id: string };
}): Promise<Metadata> {
  const key = decodeURIComponent(params.id);
  const catalog = await getPublicCatalog();
  let product = null as (typeof catalog.sections)[number]['products'][number] | null;
  let sectionSlug = '';
  for (const s of catalog.sections) {
    const p = s.products.find((x) => x.slug === key || x.id === key);
    if (p) {
      product = p;
      sectionSlug = s.slug;
      break;
    }
  }
  if (!product) return { title: 'Товар не знайдено' };

  const name = localizeProductName(product.name, params.lang);
  const description =
    params.lang === 'ru'
      ? `${name} — ${formatUAH(product.finalPrice)}. Размеры в наличии, размерная сетка, доставка Новой Почтой.`
      : `${name} — ${formatUAH(product.finalPrice)}. Розміри в наявності, розмірна сітка, доставка Новою Поштою.`;
  return {
    title: name,
    description,
    keywords: productKeywords(product, sectionSlug, params.lang),
    alternates: altMeta(params.lang, `/product/${encodeURIComponent(product.slug)}`),
    openGraph: {
      title: name,
      description,
      type: 'website',
      images: [product.image || '/logo.svg'],
    },
    twitter: { card: 'summary_large_image', title: name, description },
  };
}

export default async function ProductPage({ params }: { params: { lang: Locale; id: string } }) {
  const key = decodeURIComponent(params.id);
  const catalog = await getPublicCatalog();
  const lang = params.lang;
  const bc = dict[lang].breadcrumb;
  const lh = (p: string) => localeHref(lang, p);

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
  const productUrl = `${base}${lh(`/product/${encodeURIComponent(product.slug)}`)}`;
  const brand = detectBrand(`${product.group || ''} ${product.name}`, sectionSlug);

  const crumbs = breadcrumbJsonLd([
    { name: bc.home, url: `${base}${lh('/')}` },
    { name: bc.catalog, url: `${base}${lh('/catalog')}` },
    { name: sectionLabel, url: `${base}${lh(catHref)}` },
    { name: product.name, url: productUrl },
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm [color:#7d8f83]">
          <Link href={lh('/')} className="hover:text-brand">
            {bc.home}
          </Link>
          <span>/</span>
          <Link href={lh('/catalog')} className="hover:text-brand">
            {bc.catalog}
          </Link>
          <span>/</span>
          <Link href={lh(catHref)} className="hover:text-brand">
            {sectionLabel}
          </Link>
        </nav>
        <ProductDetail product={product} />
        <ProductSeoContent product={product} sectionSlug={sectionSlug} locale={lang} />
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
