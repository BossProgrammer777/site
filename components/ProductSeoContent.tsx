import Link from 'next/link';
import type { Product } from '@/lib/types';
import { localeHref, type Locale } from '@/lib/i18n';
import { productSeoText } from '@/lib/productSeoText';
import { articlesForSection } from '@/lib/blog';

// Уникальный SEO-блок под карточкой товара: описание + характеристики
// (тип, подошва/покрытие, условия доставки и возврата) + полезные статьи.
// Server component — весь текст попадает прямо в SSR-HTML (важно для индексации
// и чтобы Google не считал соседние карточки дублями).
export function ProductSeoContent({
  product,
  sectionSlug,
  locale,
}: {
  product: Product;
  sectionSlug: string;
  locale: Locale;
}) {
  const seo = productSeoText(product, sectionSlug, locale);
  const articles = articlesForSection(sectionSlug, locale);

  return (
    <section className="mt-12 border-t border-ink-800 pt-8">
      <div className="max-w-3xl">
        <h2 className="mb-3 text-lg font-bold [color:#e7efe9]">{seo.heading}</h2>
        <p className="text-sm leading-relaxed [color:#9fb3a6]">{seo.paragraph}</p>

        {seo.specs.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-xl border border-ink-800">
            <table className="w-full text-left text-sm">
              <tbody>
                {seo.specs.map((row) => (
                  <tr key={row.label} className="border-b border-ink-800 last:border-0 odd:bg-ink-900/40">
                    <th className="w-2/5 px-3 py-2 font-semibold [color:#7d8f83]" scope="row">
                      {row.label}
                    </th>
                    <td className="px-3 py-2 [color:#c3d3c8]">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {articles.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-bold [color:#c3d3c8]">
              {locale === 'ru' ? 'Полезно перед покупкой' : 'Корисно перед покупкою'}
            </h3>
            <ul className="space-y-1.5 text-sm">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link href={localeHref(locale, `/blog/${a.slug}`)} className="text-brand hover:underline">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
