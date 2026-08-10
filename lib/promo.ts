// Промокоди та знижки. Єдине джерело правди для клієнта (форма) і сервера (API).
// Порівняння без урахування регістру: 'sale5', 'SALE5', 'Sale5' — усі валідні.

export interface Promo {
  code: string; // у верхньому регістрі
  percent: number; // відсоток знижки
}

const PROMOS: Promo[] = [{ code: 'SALE5', percent: 5 }];

export function findPromo(input: string | null | undefined): Promo | null {
  if (!input) return null;
  const norm = input.trim().toUpperCase();
  if (!norm) return null;
  return PROMOS.find((p) => p.code === norm) || null;
}

// Сума знижки в гривнях (округлена до цілих) для заданого total.
export function promoDiscount(total: number, input: string | null | undefined): number {
  const p = findPromo(input);
  if (!p) return 0;
  return Math.round((total * p.percent) / 100);
}
