'use client';

import { useEffect, useState } from 'react';

type Item =
  | { type: 'image'; src: string }
  | { type: 'video'; thumb: string; preview: string };

// Сетка отзывов клиентов (скрины + видео из Drive-папки). Клик → лайтбокс.
// limit — сколько показать (для блока на главной); без limit — все (страница).
export function ReviewsGrid({ limit }: { limit?: number }) {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState<Item | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const vids: Item[] = (d.videos || []).map((v: { thumb: string; preview: string }) => ({
          type: 'video' as const,
          thumb: v.thumb,
          preview: v.preview,
        }));
        const imgs: Item[] = (d.images || []).map((s: string) => ({ type: 'image' as const, src: s }));
        setItems([...vids, ...imgs]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = limit ? items.slice(0, limit) : items;
  if (shown.length === 0) return null;

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        {shown.map((it, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(it)}
            className="mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl border border-ink-800 bg-ink-900 transition hover:border-brand/50"
          >
            {it.type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.src} alt="Відгук клієнта" loading="lazy" className="w-full" />
            ) : (
              <span className="relative block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.thumb} alt="Відео-відгук" loading="lazy" className="w-full" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/20">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
              </span>
            )}
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Закрити"
            className="fixed right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-ink-800/90 text-white ring-1 ring-white/10 hover:bg-ink-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {open.type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.src} alt="Відгук клієнта" className="max-h-[88vh] w-auto max-w-[94vw] rounded-xl" />
            ) : (
              <div className="h-[86vh] w-[94vw] max-w-[460px] overflow-hidden rounded-xl border border-ink-700 bg-black">
                <iframe
                  src={open.preview}
                  title="Відео-відгук"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
