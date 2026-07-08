'use client';

import Link from 'next/link';
import { useFavorites } from './FavoritesContext';

export function FavoritesLink() {
  const { count } = useFavorites();
  return (
    <Link
      href="/favorites"
      aria-label="Обране"
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-ink-700 bg-ink-900 [color:#c3d3c8] transition hover:border-brand/50 hover:text-brand"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-ink-950">
          {count}
        </span>
      )}
    </Link>
  );
}
