'use client';

import { useState } from 'react';

// Лёгкое встраивание YouTube: пока не нажали — показываем превью с кнопкой Play,
// сам iframe грузится только по клику (быстрее страница, приватнее — nocookie).
export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  const [play, setPlay] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-ink-800 bg-ink-900">
      {play ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlay(true)}
          aria-label={`Відтворити відео: ${title}`}
          className="group absolute inset-0 h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt={title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-ink-950 shadow-lg transition group-hover:scale-110">
            <svg className="ml-0.5 h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
