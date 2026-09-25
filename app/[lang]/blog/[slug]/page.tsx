import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { getArticleCopy, allArticleSlugs, relatedArticles } from '@/lib/blog';
import { siteUrl } from '@/lib/site';
import {
  articleJsonLd,
  breadcrumbJsonLd,
  categoryCopy,
  faqJsonLd,
  jsonLdScript,
} from '@/lib/seo';
import { altMeta, localeHref, Locale } from '@/lib/i18n';
import { dict } from '@/lib/dictionaries';

export function generateStaticParams() {
  return allArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale; slug: string };
}): Promise<Metadata> {
  const a = getArticleCopy(params.slug, params.lang);
  if (!a) return { title: 'Статтю не знайдено' };
  const alt = altMeta(params.lang, `/blog/${a.slug}`);
  return {
    title: { absolute: a.metaTitle },
    description: a.description,
    keywords: a.keywords,
    alternates: alt,
    openGraph: { title: a.metaTitle, description: a.description, url: alt.canonical, type: 'article' },
  };
}

export default function ArticlePage({ params }: { params: { lang: Locale; slug: string } }) {
  const a = getArticleCopy(params.slug, params.lang);
  if (!a) notFound();

  const base = siteUrl();
  const bc = dict[params.lang].breadcrumb;
  const lh = (p: string) => localeHref(params.lang, p);
  // Ссылки в html относительные — на /ru добавляем префикс локали.
  const articleHtml = params.lang === 'ru' ? a.html.replace(/href="\//g, 'href="/ru/') : a.html;
  const url = `${base}${lh(`/blog/${a.slug}`)}`;
  const crumbs = breadcrumbJsonLd([
    { name: bc.home, url: `${base}${lh('/')}` },
    { name: bc.blog, url: `${base}${lh('/blog')}` },
    { name: a.title, url },
  ]);
  const ru = params.lang === 'ru';
  const related = relatedArticles(a.slug, params.lang);
  // Разделы каталога по теме статьи (только те, у которых есть посадочная).
  const cats = a.sections
    .map((s) => categoryCopy(s, params.lang))
    .filter((c): c is NonNullable<typeof c> => !!c);
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(ru ? 'ru-UA' : 'uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-12 pt-8">
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm [color:#7d8f83]">
          <Link href={lh('/')} className="hover:text-brand">
            {bc.home}
          </Link>
          <span>/</span>
          <Link href={lh('/blog')} className="hover:text-brand">
            {bc.blog}
          </Link>
          <span>/</span>
          <span className="[color:#c3d3c8] line-clamp-1">{a.title}</span>
        </nav>

        <h1 className="mb-2 text-3xl font-extrabold leading-tight sm:text-4xl">{a.title}</h1>
        <p className="mb-6 text-xs [color:#7d8f83]">
          {ru ? 'Обновлено' : 'Оновлено'}:{' '}
          <time dateTime={a.updated || a.date}>{fmtDate(a.updated || a.date)}</time>
        </p>

        {/* Короткий прямой ответ — сразу под заголовком (удобно читателю и поиску). */}
        <div className="mb-8 rounded-2xl border border-brand/30 bg-brand/5 p-5">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand">
            {ru ? 'Коротко' : 'Коротко'}
          </p>
          <p className="text-sm leading-relaxed [color:#e7efe9] sm:text-base">{a.summary}</p>
        </div>

        <article
          className="info-content space-y-1 text-sm leading-relaxed [color:#c3d3c8] sm:text-base"
          dangerouslySetInnerHTML={{ __html: articleHtml }}
        />

        {a.faq && a.faq.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold [color:#e7efe9]">
              {params.lang === 'ru' ? 'Частые вопросы' : 'Часті запитання'}
            </h2>
            <div className="space-y-3">
              {a.faq.map((f) => (
                <details
                  key={f.q}
                  className="rounded-xl border border-ink-800 bg-ink-900/50 p-4 [color:#c3d3c8]"
                >
                  <summary className="cursor-pointer font-semibold [color:#e7efe9]">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-sm [color:#9fb3a6]">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 rounded-2xl border border-ink-800 bg-ink-900/50 p-5">
          <p className="text-sm [color:#c3d3c8]">
            {ru ? 'Готовы выбрать? Посмотрите ' : 'Готові обрати? Перегляньте '}
            <Link href={lh('/catalog')} className="font-semibold text-brand hover:underline">
              {ru ? 'каталог футбольной обуви и экипировки' : 'каталог футбольного взуття та екіпіровки'}
            </Link>
            {ru ? ' — размеры и цены обновляются автоматически.' : ' — розміри й ціни оновлюються автоматично.'}
          </p>
          {cats.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {cats.map((c) => (
                <Link
                  key={c.slug}
                  href={lh(`/catalog/${c.slug}`)}
                  className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-semibold text-brand transition hover:border-brand/50"
                >
                  {c.h1}
                </Link>
              ))}
            </div>
          )}
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold [color:#e7efe9]">{ru ? 'Читайте также' : 'Читайте також'}</h2>
            <ul className="space-y-3">
              {related.map((r) => (
                <li key={r.slug} className="rounded-xl border border-ink-800 bg-ink-900/50 p-4">
                  <Link href={lh(`/blog/${r.slug}`)} className="font-semibold text-brand hover:underline">
                    {r.title}
                  </Link>
                  <p className="mt-1 text-sm [color:#9fb3a6]">{r.excerpt}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            articleJsonLd({
              title: a.title,
              description: a.description,
              date: a.date,
              updated: a.updated,
              url,
              locale: params.lang,
              about: a.about,
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      {a.faq && a.faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd(a.faq)) }}
        />
      )}
    </>
  );
}
