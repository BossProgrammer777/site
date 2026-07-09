import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { BLOG } from '@/lib/blog';
import { altMeta, Locale } from '@/lib/i18n';

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  return {
    title: { absolute: 'Блог про футбольне взуття та екіпіровку | Bootsbaza' },
    description:
      'Корисні статті про вибір футбольного взуття: як обрати бутси дитині, різниця між бутсами, сороконіжками й футзалками, розмірна сітка та поради.',
    alternates: altMeta(params.lang, '/blog'),
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function BlogPage() {
  const articles = [...BLOG].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm [color:#7d8f83]">
          <Link href="/" className="hover:text-brand">
            Головна
          </Link>
          <span>/</span>
          <span className="[color:#c3d3c8]">Блог</span>
        </nav>

        <h1 className="mb-2 text-2xl font-extrabold sm:text-3xl">Блог</h1>
        <p className="mb-8 max-w-2xl text-sm [color:#9fb3a6]">
          Поради щодо вибору футбольного взуття та екіпіровки — для гравців, аматорів і батьків
          юних футболістів.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              className="group flex flex-col rounded-2xl border border-ink-800 bg-ink-900/50 p-5 transition hover:border-brand/50"
            >
              <span className="text-xs [color:#6b7d71]">{formatDate(a.date)}</span>
              <h2 className="mt-2 text-lg font-bold leading-snug [color:#e7efe9] transition group-hover:text-brand">
                {a.title}
              </h2>
              <p className="mt-2 flex-1 text-sm [color:#9fb3a6]">{a.excerpt}</p>
              <span className="mt-3 text-sm font-semibold text-brand">Читати →</span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
