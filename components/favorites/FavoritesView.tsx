'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Product, Section } from '@/lib/types';
import { useFavorites } from './FavoritesContext';
import { ProductCard } from '../ProductCard';

export function FavoritesView() {
  const { ids } = useFavorites();
  const [all, setAll] = useState<Product[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/catalog');
        const data = await res.json();
        if (cancelled) return;
        setAll((data.sections as Section[]).flatMap((s) => s.products));
      } catch {
        setAll([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (ids.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-800 bg-ink-900/50 py-16 text-center">
        <p className="[color:#9fb3a6]">У обраному поки порожньо.</p>
        <p className="mt-1 text-sm [color:#7d8f83]">Натисніть ♥ на товарі, щоб зберегти його тут.</p>
        <Link
          href="/catalog"
          className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
        >
          До каталогу
        </Link>
      </div>
    );
  }

  if (all === null) {
    return <p className="[color:#7d8f83]">Завантаження…</p>;
  }

  const favSet = new Set(ids);
  const favProducts = all.filter((p) => favSet.has(p.id));

  if (favProducts.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-800 bg-ink-900/50 py-16 text-center [color:#9fb3a6]">
        Обрані товари наразі недоступні (можливо, розпродані).
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {favProducts.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
