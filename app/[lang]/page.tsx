import Link from 'next/link';
import type { Metadata } from 'next';
import { getCatalog } from '@/lib/cache';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { HomeBanner } from '@/components/HomeBanner';
import { getCategorySeo } from '@/lib/seo';
import { altMeta, Locale } from '@/lib/i18n';

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

export default async function HomePage() {
  const catalog = await getCatalog();
  const totalProducts = catalog.sections.reduce((n, s) => n + s.products.length, 0);

  // Для плитки берём фото первого товара раздела как фон.
  const tiles = catalog.sections
    .filter((s) => s.products.length > 0)
    .map((s) => ({
      slug: s.slug,
      label: s.label,
      count: s.products.length,
      image: tileImage(s.products.find((p) => p.image)?.image ?? null),
    }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16">
        <HomeBanner />

        {/* Герой */}
        <section className="py-8 sm:py-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand">
            Футбольний магазин
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Бутси, сороконіжки, футзалки та екіпіровка —{' '}
            <span className="text-brand">завжди в наявності</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ink-600 [color:#9fb3a6] sm:text-base">
            Великий вибір футбольного взуття та екіпіровки — брендові моделі та бюджетні варіанти
            без бренду. Розміри, розмірна сітка та ціни оновлюються автоматично.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/catalog"
              className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
            >
              Перейти до каталогу
            </Link>
            <span className="text-sm text-ink-600 [color:#7d8f83]">
              {totalProducts} товарів у наявності
            </span>
          </div>
        </section>

        {/* Плитки-разделы */}
        <section>
          <h2 className="mb-5 text-xl font-bold sm:text-2xl">Категорії</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {tiles.map((t) => (
              <Link
                key={t.slug}
                href={sectionHref(t.slug)}
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-ink-800 bg-ink-900 sm:aspect-[4/3]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.image}
                  alt={t.label}
                  loading="lazy"
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
                    {t.count} товарів
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
