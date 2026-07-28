import type { Product } from '@/lib/types';
import type { Locale } from '@/lib/i18n';
import { productSeoText } from '@/lib/productSeoText';

// Уникальный SEO-блок под карточкой товара: описание + характеристики.
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
      </div>
    </section>
  );
}
