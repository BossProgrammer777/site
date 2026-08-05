import Link from 'next/link';
import type { Metadata } from 'next';
import { getCatalog } from '@/lib/cache';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { HomeBanner } from '@/components/HomeBanner';
import { ProductCard } from '@/components/ProductCard';
import { getCategorySeo } from '@/lib/seo';
import { altMeta, localeHref, Locale } from '@/lib/i18n';
import { dict, sectionLabel } from '@/lib/dictionaries';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  return { alternates: altMeta(params.lang, '/') };
}

// Ссылка на раздел: ЧПУ-посадочная, если она есть, иначе фильтр каталога.
function sectionHref(slug: string): string {
  return getCategorySeo(slug) ? `/catalog/${slug}` : `/catalog?section=${slug}`;
}

function tileImage(image: string | null): string {
  if (!image) return '/placeholder.svg';
  if (image.startsWith('data:') || image.startsWith('/') || image.startsWith('http')) return image;
  return '/placeholder.svg';
}

export default async function HomePage({ params }: { params: { lang: Locale } }) {
  const catalog = await getCatalog();
  const totalProducts = catalog.sections.reduce((n, s) => n + s.products.length, 0);
  const tr = dict[params.lang].home;
  const href = (p: string) => localeHref(params.lang, p);

  // Для плитки берём фото первого товара раздела как фон.
  const tiles = catalog.sections
    .filter((s) => s.products.length > 0)
    .map((s) => ({
      slug: s.slug,
      label: sectionLabel(s.slug, s.label, params.lang),
      count: s.products.length,
      image: tileImage(s.products.find((p) => p.image)?.image ?? null),
    }));

  // Популярное: товары в наличии, дороже — выше (премиальные модели вперёд).
  // Показываем сразу на главной, чтобы посетитель видел товар и цену за секунды.
  const popular = catalog.sections
    .flatMap((s) => s.products)
    .filter((p) => p.anyInStock)
    .sort((a, b) => b.finalPrice - a.finalPrice)
    .slice(0, 8);

  const trust = [
    {
      label: tr.trustDelivery,
      icon: (
        <path d="M1 6h13v10H1zM14 9h4l3 3v4h-7zM6 18a1.6 1.6 0 100-3.2A1.6 1.6 0 006 18zm12 0a1.6 1.6 0 100-3.2 1.6 1.6 0 000 3.2z" />
      ),
    },
    {
      label: tr.trustPayment,
      icon: <path d="M2 5h20v14H2zM2 9h20M6 15h4" />,
    },
    {
      label: tr.trustReturn,
      icon: <path d="M3 8a9 9 0 0114-2m1 2V4m0 4h-4M21 16a9 9 0 01-14 2m-1-2v4m0-4h4" />,
    },
  ];

  return (
    <>
      {/* Ранняя загрузка первого баннера — это LCP-элемент на мобильном. */}
      <link rel="preload" as="image" href="/banners/2.webp" fetchPriority="high" />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16">
        <HomeBanner />

        {/* Строка доверия: доставка / оплата при отриманні / обмін.
            Сразу под баннером — важно для соцтрафика (реплики требуют доверия). */}
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-ink-800 bg-ink-900/60 p-2.5 sm:gap-4 sm:p-3">
          {trust.map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:justify-center sm:gap-2">
              <svg
                className="h-5 w-5 shrink-0 text-brand"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {t.icon}
              </svg>
              <span className="text-[11px] font-semibold leading-tight [color:#c3d3c8] sm:text-sm">
                {t.label}
              </span>
            </div>
          ))}
        </div>

        {/* Герой */}
        <section className="py-8 sm:py-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand">
            {tr.badge}
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            {tr.heroA} <span className="text-brand">{tr.heroB}</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ink-600 [color:#9fb3a6] sm:text-base">
            {tr.heroSub}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={href('/catalog')}
              className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
            >
              {tr.toCatalog}
            </Link>
            <span className="text-sm text-ink-600 [color:#7d8f83]">
              {totalProducts} {tr.inStockCount}
            </span>
          </div>
        </section>

        {/* Популярные товары: сразу видны товар + цена + «в наявності».
            grid-cols-2 на мобильном — витрина открывается без клика в каталог. */}
        {popular.length > 0 && (
          <section className="pb-2">
            <h2 className="mb-4 text-xl font-bold sm:text-2xl">{tr.popular}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {popular.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Плитки-разделы */}
        <section>
          <h2 className="mb-5 text-xl font-bold sm:text-2xl">{tr.categories}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {tiles.map((t, ti) => (
              <Link
                key={t.slug}
                href={href(sectionHref(t.slug))}
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 sm:aspect-[4/3]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.image}
                  alt={t.label}
                  // Первый ряд плиток виден на первом экране — грузим не лениво.
                  loading={ti < 2 ? 'eager' : 'lazy'}
                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent" />
                <div className="relative p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold leading-tight drop-shadow sm:text-xl">
                      {t.label}
                    </h3>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-ink-950 transition group-hover:translate-x-0.5">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 4l6 6-6 6" />
                      </svg>
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-ink-600 [color:#c3d3c8]">
                    {t.count} {tr.itemsShort}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
