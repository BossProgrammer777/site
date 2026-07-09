'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { productImageSrc, PLACEHOLDER } from '@/lib/img';
import { formatUAH } from '@/lib/format';
import { useLocale, useT } from './LocaleProvider';
import { localeHref } from '@/lib/i18n';

interface Suggestion {
  slug: string;
  name: string;
  group: string | null;
  price: number;
  image: string | null;
}

export function HeaderSearch({
  className = '',
  onSubmitted,
}: {
  className?: string;
  onSubmitted?: () => void;
}) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // выбранная стрелками подсказка
  const router = useRouter();
  const locale = useLocale();
  const t = useT();
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Дебаунс запроса подсказок.
  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) {
      setItems([]);
      setActive(-1);
      abortRef.current?.abort();
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(t)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: Suggestion[] };
        setItems(data.items || []);
        setActive(-1);
      } catch {
        /* прервано или ошибка сети — молча игнорируем */
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [q]);

  // Закрытие по клику вне блока.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const goToCatalog = (term: string) => {
    const term2 = term.trim();
    router.push(localeHref(locale, term2 ? `/catalog?q=${encodeURIComponent(term2)}` : '/catalog'));
    setOpen(false);
    onSubmitted?.();
  };

  const goToProduct = (s: Suggestion) => {
    router.push(localeHref(locale, `/product/${encodeURIComponent(s.slug)}`));
    setQ('');
    setItems([]);
    setOpen(false);
    onSubmitted?.();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && items[active]) {
      goToProduct(items[active]);
    } else {
      goToCatalog(q);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showDropdown = open && q.trim().length >= 2 && items.length > 0;

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form onSubmit={submit} role="search">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 [color:#6b7d71]"
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
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={t.search.placeholder}
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            className="w-full rounded-xl border border-ink-700 bg-ink-900/80 py-2 pl-9 pr-3 text-sm [color:#e7efe9] outline-none placeholder:[color:#6b7d71] focus:border-brand/60 focus:ring-1 focus:ring-brand/40"
          />
        </div>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-ink-700 bg-ink-950 shadow-2xl">
          <ul className="max-h-[70vh] overflow-y-auto py-1">
            {items.map((s, i) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => goToProduct(s)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${
                    active === i ? 'bg-ink-800' : 'hover:bg-ink-900'
                  }`}
                >
                  <img
                    src={productImageSrc(s.image)}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-lg border border-ink-800 bg-ink-900 object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm [color:#e7efe9]">{s.name}</span>
                    {s.group && (
                      <span className="block truncate text-xs [color:#6b7d71]">{s.group}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-brand">
                    {formatUAH(s.price)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => goToCatalog(q)}
            className="block w-full border-t border-ink-800 px-3 py-2.5 text-center text-sm font-semibold text-brand transition hover:bg-ink-900"
          >
            {t.search.showAll}
          </button>
        </div>
      )}
    </div>
  );
}
