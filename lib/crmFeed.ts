// ---------------------------------------------------------------------------
// Подмешивание товаров из BootsBaza CRM (закрытый фид /api/site-feed).
// В CRM оператор помечает товар «Вигрузити на сайт» — тут мы забираем такие
// товары и добавляем в соответствующие разделы каталога. Всё best-effort:
// нет URL/токена или ошибка сети → возвращаем [] и сайт работает как обычно.
// ---------------------------------------------------------------------------

import { Product, SizeAvailability } from './types';
import { productSlug } from './slug';

interface CrmFeedItem {
  code: string;
  name: string;
  section: string; // slug раздела сайта (butsy / sorokonizhky / …)
  group: string | null;
  country: string;
  finalPrice: number;
  image: string | null;
  images?: (string | null)[];
  sizes: { label: string; qty: number }[];
  notes: string | null;
}

export interface CrmProduct {
  section: string;
  product: Product;
}

function toProduct(it: CrmFeedItem): Product {
  const sizes: SizeAvailability[] = (it.sizes || []).map((s) => ({
    label: s.label,
    qty: s.qty,
    inStock: s.qty > 0,
  }));
  const anyInStock = sizes.some((s) => s.inStock);
  return {
    id: `crm-${it.code}`,
    slug: productSlug(it.name, it.code),
    code: it.code,
    name: it.name,
    country: it.country || '',
    finalPrice: it.finalPrice,
    image: it.image || (it.images && it.images[0]) || null,
    sizes,
    sizeGrid: [],
    notes: it.notes || null,
    group: it.group || null,
    anyInStock,
    mediaUrl: null,
  };
}

export async function fetchCrmProducts(): Promise<CrmProduct[]> {
  const url = process.env.CRM_FEED_URL;
  const token = process.env.CRM_SYNC_TOKEN;
  if (!url || !token) return []; // фид не настроен — тихо пропускаем

  try {
    const res = await fetch(url, {
      headers: { 'x-crm-token': token },
      cache: 'no-store',
      // не даём фиду подвесить сборку каталога
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.products)) return [];
    return (data.products as CrmFeedItem[])
      .filter((it) => it && it.code && it.section && it.finalPrice > 0)
      .map((it) => ({ section: it.section, product: toProduct(it) }))
      .filter((x) => x.product.anyInStock);
  } catch {
    return [];
  }
}
