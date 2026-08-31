'use client';

import Link from 'next/link';
import type { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { useSelectedSize } from './SelectedSizeContext';
import { localeHref, type Locale } from '@/lib/i18n';

// Блок «Схожі товари» под карточкой товара. Ссылки на другие товары попадают в
// HTML (внутрішня перелінковка товар→товар пришвидшує обхід і індексацію).
// Кандидаты приходят уже отранжированными (та сама модель → бренд → категорія);
// тут довантажуємо реакцію на вибраний розмір — моделі з цим розміром угорі.
function hasSize(p: Product, size: string): boolean {
  return p.sizes.some((s) => s.label === size && s.inStock);
}

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
  const { size } = useSelectedSize();

  // Если выбран размер — сначала модели, где он есть (порядок ранжирования
  // сохраняется внутри групп), затем остальные. Иначе — как пришло.
  const ordered = size
    ? [...products.filter((p) => hasSize(p, size)), ...products.filter((p) => !hasSize(p, size))]
    : products;
  const shown = ordered.slice(0, 4);

  if (shown.length === 0) return null;

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
        {shown.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            preselectSize={size && hasSize(p, size) ? size : null}
          />
        ))}
      </div>
    </section>
  );
}
