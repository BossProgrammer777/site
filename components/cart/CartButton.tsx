'use client';

import Link from 'next/link';
import { useCart } from './CartContext';

export function CartButton() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      aria-label="Кошик"
      className="relative flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm font-semibold text-ink-600 [color:#e7efe9] transition hover:border-brand/50"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 6h15l-1.5 9h-12z" />
        <path d="M6 6L5 3H2" />
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
      </svg>
      <span className="hidden sm:inline">Кошик</span>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-ink-950">
          {count}
        </span>
      )}
    </Link>
  );
}
