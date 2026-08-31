import Link from 'next/link';
import type { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { localeHref, type Locale } from '@/lib/i18n';

// Блок «Схожі товари» под карточкой товара. Server component — ссылки на другие
// товары попадают в SSR-HTML, тому Google переходить з однієї сторінки на іншу
// (внутрішня перелінковка пришвидшує обхід і індексацію).
export function SimilarProducts({
  products,
  moreHref,
  categoryLabel,
  locale,
}: {
  products: Product[];
  /** «Чистый» путь на категорию (без локали), напр. '/catalog/butsy'. */
  moreHref: string;
  categoryLabel: string;
  locale: Locale;
}) {
  if (products.length === 0) return null;

  const title = locale === 'ru' ? 'Похожие товары' : 'Схожі товари';
  const more = locale === 'ru' ? `Все ${categoryLabel.toLowerCase()}` : `Усі ${categoryLabel.toLowerCase()}`;

  return (
    <section className="mt-14 border-t border-ink-800 pt-8">
      <div className="mb-5 flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold [color:#e7efe9] sm:text-xl">{title}</h2>
        <Link
          href={localeHref(locale, moreHref)}
          className="shrink-0 text-sm font-semibold text-brand hover:underline"
        >
          {more} →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
