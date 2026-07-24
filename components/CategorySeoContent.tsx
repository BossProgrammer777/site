import Link from 'next/link';
import { localeHref, type Locale } from '@/lib/i18n';
import type { CategorySeoRich } from '@/lib/seo';

// SEO-блок под каталогом на странице категории: H2 «Як вибрати / Види / Бренди»,
// внутренние ссылки на брендовые посадочные и FAQ. Server component — весь текст
// и ссылки попадают в SSR-HTML (важно для индексации).
export function CategorySeoContent({
  content,
  categorySlug,
  categoryH1,
  brands,
  locale,
}: {
  content: CategorySeoRich;
  categorySlug: string;
  categoryH1: string;
  /** Только реально непустые бренды категории (для внутренней перелинковки). */
  brands: { slug: string; name: string }[];
  locale: Locale;
}) {
  const lh = (p: string) => localeHref(locale, p);
  const h2 = 'mb-2 text-lg font-bold [color:#e7efe9]';

  return (
    <section className="mt-12 border-t border-ink-800 pt-8">
      <div className="max-w-3xl space-y-6 text-sm leading-relaxed [color:#9fb3a6]">
        <div>
          <h2 className={h2}>{content.howTo.title}</h2>
          <p>{content.howTo.text}</p>
        </div>

        <div>
          <h2 className={h2}>{content.kinds.title}</h2>
          <p>{content.kinds.text}</p>
        </div>

        <div>
          <h2 className={h2}>{content.brandsBlock.title}</h2>
          <p>{content.brandsBlock.text}</p>
          {brands.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {brands.map((b) => (
                <Link
                  key={b.slug}
                  href={lh(`/catalog/${categorySlug}/${b.slug}`)}
                  className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-semibold text-brand transition hover:border-brand/50"
                >
                  {categoryH1} {b.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {content.faq.length > 0 && (
          <div>
            <h2 className={`mb-3 text-lg font-bold [color:#e7efe9]`}>{content.faqTitle}</h2>
            <div className="space-y-4">
              {content.faq.map((f, i) => (
                <div key={i}>
                  <h3 className="mb-1 font-semibold [color:#c3d3c8]">{f.question}</h3>
                  <p>{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
