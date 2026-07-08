'use client';

import { useMemo, useState } from 'react';
import type { Section } from '@/lib/types';
import { ProductCard } from './ProductCard';

export function CatalogBrowser({ sections }: { sections: Section[] }) {
  const available = sections.filter((s) => s.products.length > 0);
  const [activeSlug, setActiveSlug] = useState(available[0]?.slug ?? sections[0]?.slug);
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);

  const section = sections.find((s) => s.slug === activeSlug) ?? sections[0];

  const filtered = useMemo(() => {
    if (!section) return [];
    const q = query.trim().toLowerCase();
    return section.products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) return false;
      if (country && p.country !== country) return false;
      if (onlyInStock && !p.anyInStock) return false;
      return true;
    });
  }, [section, query, country, onlyInStock]);

  // Группировка по подкатегории с сохранением порядка появления.
  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const p of filtered) {
      const key = p.group || 'Інше';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div>
      {/* Навигация по разделам */}
      <nav className="sticky top-[57px] z-20 -mx-4 border-b border-ink-800 bg-ink-950/85 px-4 py-2 backdrop-blur">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {available.map((s) => (
            <button
              key={s.slug}
              onClick={() => setActiveSlug(s.slug)}
              className={
                'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ' +
                (s.slug === activeSlug
                  ? 'bg-brand text-ink-950'
                  : 'bg-ink-800 text-ink-600 [color:#c3d3c8] hover:bg-ink-700')
              }
            >
              {s.label}
              <span className="ml-1.5 text-xs opacity-60">{s.products.length}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Панель поиска и фильтров */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600 [color:#6b7d71]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a1 1 0 01-1.42 1.42l-3.08-3.08A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук за назвою або кодом…"
            className="w-full rounded-xl border border-ink-700 bg-ink-900 py-2.5 pl-10 pr-3 text-sm text-ink-600 [color:#e7efe9] outline-none placeholder:text-ink-600 [color:#6b7d71] focus:border-brand/60 focus:ring-1 focus:ring-brand/40"
          />
        </div>

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-ink-600 [color:#e7efe9] outline-none focus:border-brand/60"
        >
          <option value="">Усі країни</option>
          {section?.countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="flex cursor-pointer select-none items-center gap-2 rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-ink-600 [color:#c3d3c8]">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Лише в наявності
        </label>
      </div>

      <p className="mt-3 text-xs text-ink-600 [color:#7d8f83]">
        Знайдено товарів: <span className="font-semibold text-brand">{filtered.length}</span>
      </p>

      {/* Товары, сгруппированные по подкатегориям */}
      {groups.length === 0 ? (
        <div className="mt-16 text-center text-ink-600 [color:#7d8f83]">
          За вашим запитом нічого не знайдено.
        </div>
      ) : (
        <div className="mt-6 space-y-10">
          {groups.map(([group, items]) => (
            <section key={group}>
              <h2 className="mb-4 flex items-center gap-3 text-lg font-bold">
                <span className="h-5 w-1 rounded-full bg-brand" />
                {group}
                <span className="text-sm font-normal text-ink-600 [color:#7d8f83]">
                  {items.length}
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
