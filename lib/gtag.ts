// Отправка событий в Google Analytics (GA4) и, опционально, конверсии в Google Ads.
// gtag.js подключается в компоненте Analytics (только если задан NEXT_PUBLIC_GA_ID).

type GtagArgs = [string, ...unknown[]];

declare global {
  interface Window {
    gtag?: (...args: GtagArgs) => void;
    dataLayer?: unknown[];
  }
}

export interface PurchaseItem {
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
}

export interface PurchaseOpts {
  value: number;
  currency?: string;
  transactionId?: string;
  items?: PurchaseItem[];
}

// Вызывается при успешном оформлении заказа. Шлёт событие `purchase` в GA4
// (видно в аналитике сразу) и, если настроена реклама — конверсию в Google Ads.
export function trackPurchase(opts: PurchaseOpts): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  const currency = opts.currency || 'UAH';
  const transactionId = opts.transactionId || `bb-${Date.now()}`;

  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value: opts.value,
    currency,
    items: (opts.items || []).map((i) => ({
      item_id: i.id,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  });

  // Прямая конверсия Google Ads — активируется, когда заданы ID и метка
  // конверсии из рекламного кабинета (иначе строка не выполняется).
  const adsId = process.env.NEXT_PUBLIC_GADS_ID; // напр. AW-123456789
  const adsLabel = process.env.NEXT_PUBLIC_GADS_LABEL; // метка конверсии
  if (adsId && adsLabel) {
    window.gtag('event', 'conversion', {
      send_to: `${adsId}/${adsLabel}`,
      value: opts.value,
      currency,
      transaction_id: transactionId,
    });
  }
}
