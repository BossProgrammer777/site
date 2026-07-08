import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/cache';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ProductDetail } from '@/components/ProductDetail';
import { formatUAH } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
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
    | { product: (typeof catalog.sections)[number]['products'][number]; sectionLabel: string }
    | null;
  for (const s of catalog.sections) {
    const p = s.products.find((x) => x.slug === key || x.id === key);
    if (p) {
      found = { product: p, sectionLabel: s.label };
      break;
    }
  }
  if (!found) notFound();

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
          <span className="[color:#c3d3c8]">{found.sectionLabel}</span>
        </nav>
        <ProductDetail product={found.product} />
      </main>
      <SiteFooter />
    </>
  );
}
