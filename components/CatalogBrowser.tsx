'use client';

import { useMemo, useState } from 'react';
import type { Section } from '@/lib/types';
import { ProductCard } from './ProductCard';

const OTHER = 'Інше';
const NO_BRAND = 'Без бренду';

// Приводим кириллические «двойники» латиницы к латинице (напр. «Аdidas» → «adidas»).
const HOMOGLYPHS: Record<string, string> = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', х: 'x', і: 'i', у: 'y', к: 'k', м: 'm', н: 'n', т: 't', в: 'b',
};
function normalize(s: string): string {
  return s.toLowerCase().replace(/[аеорсхіукмнтв]/g, (ch) => HOMOGLYPHS[ch] || ch);
}

// Бренд по названию/подкатегории (латиница + кириллица + распространённые алиасы).
// ВАЖНО: разделы «НБ …» = No Brand (безбрендовые копии), а не New Balance.
const BRAND_RULES: [RegExp, string][] = [
  [/new balance|нью ?баланс/i, 'New Balance'],
  [/nike|найк/i, 'Nike'],
  [/adidas|ад[іи]дас/i, 'Adidas'],
  [/puma|пума/i, 'Puma'],
  [/mizuno|м[іи]зуно/i, 'Mizuno'],
  [/joma|джома/i, 'Joma'],
  [/under armour|андер армор/i, 'Under Armour'],
  [/umbro|умбро/i, 'Umbro'],
  [/kelme|кельме/i, 'Kelme'],
  [/diadora|діадора/i, 'Diadora'],
  [/lotto|лотто/i, 'Lotto'],
  [/asics|асікс/i, 'Asics'],
  [/reebok|рібок/i, 'Reebok'],
  [/nivia|нівіа/i, 'Nivia'],
  [/puma|пума/i, 'Puma'],
];
function detectBrand(text: string, sectionSlug: string): string {
  // Разделы «НБ …» = No Brand: безбрендовые копії, навіть якщо назва схожа на бренд.
  if (sectionSlug.startsWith('nb-')) return NO_BRAND;
  const norm = normalize(text);
  for (const [re, name] of BRAND_RULES) if (re.test(text) || re.test(norm)) return name;
  return OTHER;
}

// Чистим у модели ведущее слово-категорию, чтобы «Бутси Nike Mercurial» и
// «Nike Mercurial» объединялись.
const MODEL_PREFIX = /^(бутси|сороконіжки|футзалки|копочки|дитячі|дитяче|взуття)\s+/i;
function cleanModel(group: string | null): string {
  if (!group) return 'Інше';
  const stripped = group.replace(MODEL_PREFIX, '').trim();
  return stripped || group;
}

const sizeSort = (a: string, b: string) => {
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  if (!isNaN(na)) return -1;
  if (!isNaN(nb)) return 1;
  return a.localeCompare(b, 'uk');
};

interface Item {
  product: Section['products'][number];
  sectionSlug: string;
  sectionLabel: string;
  brand: string;
  model: string;
  sizesInStock: Set<string>;
}

interface Selection {
  sections: Set<string>;
  brands: Set<string>;
  models: Set<string>;
  sizes: Set<string>;
  countries: Set<string>;
  query: string;
  priceFrom: number;
  priceTo: number;
}

type Dim = 'section' | 'brand' | 'model' | 'size' | 'country';

const PAGE = 60;

export function CatalogBrowser({
  sections,
  initialSections = [],
  initialBrands = [],
}: {
  sections: Section[];
  initialSections?: string[];
  initialBrands?: string[];
}) {
  const items = useMemo<Item[]>(
    () =>
      sections.flatMap((s) =>
        s.products.map((p) => ({
          product: p,
          sectionSlug: s.slug,
          sectionLabel: s.label,
          brand: detectBrand(`${p.group || ''} ${p.name}`, s.slug),
          model: cleanModel(p.group),
          sizesInStock: new Set(p.sizes.filter((x) => x.inStock).map((x) => x.label)),
        })),
      ),
    [sections],
  );

  // Границы цены по реальным ценам сайта.
  const priceBounds = useMemo(() => {
    let lo = Infinity;
    let hi = 0;
    for (const it of items) {
      const p = it.product.finalPrice;
      if (p < lo) lo = p;
      if (p > hi) hi = p;
    }
    if (!isFinite(lo)) lo = 0;
    return { min: Math.floor(lo), max: Math.ceil(hi) };
  }, [items]);

  const [sel, setSel] = useState<Selection>({
    sections: new Set(initialSections),
    brands: new Set(initialBrands),
    models: new Set(),
    sizes: new Set(),
    countries: new Set(),
    query: '',
    priceFrom: priceBounds.min,
    priceTo: priceBounds.max,
  });
  const [visible, setVisible] = useState(PAGE);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');

  const passes = (it: Item, exclude: Dim | null): boolean => {
    if (exclude !== 'section' && sel.sections.size && !sel.sections.has(it.sectionSlug)) return false;
    if (exclude !== 'brand' && sel.brands.size && !sel.brands.has(it.brand)) return false;
    if (exclude !== 'model' && sel.models.size && !sel.models.has(it.model)) return false;
    if (exclude !== 'size' && sel.sizes.size && ![...sel.sizes].some((s) => it.sizesInStock.has(s)))
      return false;
    if (exclude !== 'country' && sel.countries.size && !sel.countries.has(it.product.country))
      return false;
    if (it.product.finalPrice < sel.priceFrom || it.product.finalPrice > sel.priceTo) return false;
    if (sel.query) {
      const q = sel.query.toLowerCase();
      if (!it.product.name.toLowerCase().includes(q) && !it.product.code.toLowerCase().includes(q))
        return false;
    }
    return true;
  };

  const filtered = useMemo(() => {
    const base = items.filter((it) => passes(it, null));
    if (sortBy === 'price-asc') base.sort((a, b) => a.product.finalPrice - b.product.finalPrice);
    else if (sortBy === 'price-desc') base.sort((a, b) => b.product.finalPrice - a.product.finalPrice);
    else if (sortBy === 'name')
      base.sort((a, b) => a.product.name.localeCompare(b.product.name, 'uk'));
    return base;
  }, [items, sel, sortBy]);

  // Опции фасета с учётом всех остальных выбранных фильтров.
  const facet = (dim: Dim, valueOf: (it: Item) => string[]) => {
    const base = items.filter((it) => passes(it, dim));
    const counts = new Map<string, number>();
    for (const it of base) for (const v of valueOf(it)) if (v) counts.set(v, (counts.get(v) || 0) + 1);
    return counts;
  };

  const sectionFacet = useMemo(() => facet('section', (it) => [it.sectionLabel]), [items, sel]);
  const brandFacet = useMemo(() => facet('brand', (it) => [it.brand]), [items, sel]);
  const modelFacet = useMemo(() => facet('model', (it) => [it.model]), [items, sel]);
  const sizeFacet = useMemo(() => facet('size', (it) => [...it.sizesInStock]), [items, sel]);
  const countryFacet = useMemo(() => facet('country', (it) => [it.product.country]), [items, sel]);

  // Соответствие label ↔ slug для секций.
  const sectionSlugByLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sections) m.set(s.label, s.slug);
    return m;
  }, [sections]);

  const toggle = (key: keyof Selection, value: string) => {
    setSel((prev) => {
      const next = new Set(prev[key] as Set<string>);
      next.has(value) ? next.delete(value) : next.add(value);
      return { ...prev, [key]: next };
    });
    setVisible(PAGE);
  };

  const priceActive = sel.priceFrom > priceBounds.min || sel.priceTo < priceBounds.max;
  const activeCount =
    sel.sections.size +
    sel.brands.size +
    sel.models.size +
    sel.sizes.size +
    sel.countries.size +
    (priceActive ? 1 : 0);

  const reset = () =>
    setSel({
      sections: new Set(),
      brands: new Set(),
      models: new Set(),
      sizes: new Set(),
      countries: new Set(),
      query: '',
      priceFrom: priceBounds.min,
      priceTo: priceBounds.max,
    });

  const setPrice = (from: number, to: number) => {
    setSel((p) => ({ ...p, priceFrom: from, priceTo: to }));
    setVisible(PAGE);
  };

  // Группировка видимой части. При активной сортировке — плоский список (одна
  // группа без заголовка), иначе — по модели.
  const groups = useMemo(() => {
    const slice = filtered.slice(0, visible);
    if (sortBy !== 'default') return [['', slice]] as [string, Item[]][];
    const map = new Map<string, Item[]>();
    for (const it of slice) {
      const key = it.model;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries());
  }, [filtered, visible, sortBy]);

  const sortedFacet = (m: Map<string, number>, sorter?: (a: string, b: string) => number) =>
    Array.from(m.entries()).sort((a, b) =>
      sorter ? sorter(a[0], b[0]) : b[1] - a[1] || a[0].localeCompare(b[0], 'uk'),
    );

  return (
    <div className="lg:flex lg:gap-8">
      {/* Кнопка фильтров (моб.) */}
      <button
        onClick={() => setShowFilters((v) => !v)}
        className="mb-4 flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-sm font-semibold text-ink-600 [color:#e7efe9] lg:hidden"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Фільтри{activeCount > 0 && <span className="text-brand">· {activeCount}</span>}
      </button>

      {/* Сайдбар фильтров */}
      <aside
        className={
          'shrink-0 lg:block lg:w-64 ' + (showFilters ? 'block' : 'hidden')
        }
      >
        <div className="lg:sticky lg:top-[70px] space-y-5 rounded-2xl border border-ink-800 bg-ink-900/50 p-4 lg:max-h-[calc(100vh-90px)] lg:overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600 [color:#c3d3c8]">
              Фільтри
            </h2>
            {activeCount > 0 && (
              <button onClick={reset} className="text-xs text-brand hover:underline">
                Скинути
              </button>
            )}
          </div>

          <FacetGroup
            title="Вид товару"
            options={sortedFacet(sectionFacet)}
            isChecked={(label) => sel.sections.has(sectionSlugByLabel.get(label) || label)}
            onToggle={(label) => toggle('sections', sectionSlugByLabel.get(label) || label)}
          />
          <FacetGroup
            title="Бренд"
            options={sortedFacet(brandFacet)}
            isChecked={(v) => sel.brands.has(v)}
            onToggle={(v) => toggle('brands', v)}
          />
          {priceBounds.max > priceBounds.min && (
            <PriceRange
              min={priceBounds.min}
              max={priceBounds.max}
              from={sel.priceFrom}
              to={sel.priceTo}
              onChange={setPrice}
            />
          )}
          <FacetGroup
            title="Модель"
            options={sortedFacet(modelFacet)}
            isChecked={(v) => sel.models.has(v)}
            onToggle={(v) => toggle('models', v)}
            scroll
          />
          <FacetGroup
            title="Розмір"
            options={sortedFacet(sizeFacet, sizeSort)}
            isChecked={(v) => sel.sizes.has(v)}
            onToggle={(v) => toggle('sizes', v)}
            grid
          />
          {countryFacet.size > 0 && (
            <FacetGroup
              title="Країна"
              options={sortedFacet(countryFacet)}
              isChecked={(v) => sel.countries.has(v)}
              onToggle={(v) => toggle('countries', v)}
            />
          )}
        </div>
      </aside>

      {/* Результаты */}
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
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
              value={sel.query}
              onChange={(e) => {
                setSel((p) => ({ ...p, query: e.target.value }));
                setVisible(PAGE);
              }}
              placeholder="Пошук за назвою або кодом…"
              className="w-full rounded-xl border border-ink-700 bg-ink-900 py-2.5 pl-10 pr-3 text-sm text-ink-600 [color:#e7efe9] outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/40"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as typeof sortBy);
              setVisible(PAGE);
            }}
            className="rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm [color:#e7efe9] outline-none focus:border-brand/60 sm:w-56"
            aria-label="Сортування"
          >
            <option value="default">За замовчуванням</option>
            <option value="price-asc">Спочатку дешевші</option>
            <option value="price-desc">Спочатку дорожчі</option>
            <option value="name">За назвою (А–Я)</option>
          </select>
        </div>

        <p className="mb-4 text-xs text-ink-600 [color:#7d8f83]">
          Знайдено товарів: <span className="font-semibold text-brand">{filtered.length}</span>
        </p>

        {groups.length === 0 ? (
          <div className="mt-16 text-center text-ink-600 [color:#7d8f83]">
            За обраними фільтрами нічого не знайдено.
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map(([group, list]) => (
              <section key={group}>
                {group && (
                  <h3 className="mb-4 flex items-center gap-3 text-lg font-bold">
                    <span className="h-5 w-1 rounded-full bg-brand" />
                    {group}
                    <span className="text-sm font-normal text-ink-600 [color:#7d8f83]">{list.length}</span>
                  </h3>
                )}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {list.map((it) => (
                    <ProductCard key={it.product.id} product={it.product} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {visible < filtered.length && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setVisible((v) => v + PAGE)}
              className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
            >
              Показати ще ({filtered.length - visible})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Фильтр цены (от/до + двойной ползунок) ----------------------------------
function PriceRange({
  min,
  max,
  from,
  to,
  onChange,
}: {
  min: number;
  max: number;
  from: number;
  to: number;
  onChange: (from: number, to: number) => void;
}) {
  const setFrom = (v: number) => onChange(Math.min(Math.max(min, v), to), to);
  const setTo = (v: number) => onChange(from, Math.max(Math.min(max, v), from));
  const pct = (v: number) => ((v - min) / (max - min || 1)) * 100;
  const inputCls =
    'w-full rounded-lg border border-ink-700 bg-ink-900 px-2 py-1.5 text-sm [color:#e7efe9] outline-none focus:border-brand/60';

  return (
    <div className="border-t border-ink-800 pt-4">
      <h3 className="mb-3 text-sm font-semibold [color:#e7efe9]">Ціна, грн</h3>
      <div className="mb-3 flex items-center gap-2">
        <input
          type="number"
          value={from}
          min={min}
          max={to}
          aria-label="Ціна від"
          onChange={(e) => setFrom(Number(e.target.value) || min)}
          className={inputCls}
        />
        <span className="[color:#7d8f83]">—</span>
        <input
          type="number"
          value={to}
          min={from}
          max={max}
          aria-label="Ціна до"
          onChange={(e) => setTo(Number(e.target.value) || max)}
          className={inputCls}
        />
      </div>
      <div className="relative h-5">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded bg-ink-700" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-brand"
          style={{ left: `${pct(from)}%`, width: `${pct(to) - pct(from)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={from}
          onChange={(e) => setFrom(Number(e.target.value))}
          className="price-range absolute inset-0 h-5 w-full"
          aria-label="Мінімальна ціна"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={to}
          onChange={(e) => setTo(Number(e.target.value))}
          className="price-range absolute inset-0 h-5 w-full"
          aria-label="Максимальна ціна"
        />
      </div>
    </div>
  );
}

// --- Группа фасета -----------------------------------------------------------
function FacetGroup({
  title,
  options,
  isChecked,
  onToggle,
  scroll,
  grid,
}: {
  title: string;
  options: [string, number][];
  isChecked: (v: string) => boolean;
  onToggle: (v: string) => void;
  scroll?: boolean;
  grid?: boolean;
}) {
  const [open, setOpen] = useState(true);
  if (options.length === 0) return null;

  return (
    <div className="border-t border-ink-800 pt-4 first:border-0 first:pt-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="mb-2 flex w-full items-center justify-between text-sm font-semibold text-ink-600 [color:#e7efe9]"
      >
        {title}
        <svg
          className={'h-3.5 w-3.5 text-ink-600 [color:#7d8f83] transition ' + (open ? 'rotate-180' : '')}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open &&
        (grid ? (
          <div className="flex flex-wrap gap-1.5">
            {options.map(([value]) => (
              <button
                key={value}
                onClick={() => onToggle(value)}
                className={
                  'min-w-[2.4rem] rounded-md px-2 py-1 text-xs font-semibold transition ' +
                  (isChecked(value)
                    ? 'bg-brand text-ink-950'
                    : 'bg-ink-800 text-ink-600 [color:#c3d3c8] hover:bg-ink-700')
                }
              >
                {value}
              </button>
            ))}
          </div>
        ) : (
          <ul className={'space-y-1 ' + (scroll ? 'max-h-56 overflow-y-auto pr-1' : '')}>
            {options.map(([value, count]) => (
              <li key={value}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-ink-600 [color:#c3d3c8] hover:bg-ink-800">
                  <input
                    type="checkbox"
                    checked={isChecked(value)}
                    onChange={() => onToggle(value)}
                    className="h-4 w-4 shrink-0 accent-brand"
                  />
                  <span className="flex-1 truncate">{value}</span>
                  <span className="text-xs text-ink-600 [color:#6b7d71]">{count}</span>
                </label>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
