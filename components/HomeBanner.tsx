'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocale, useT } from './LocaleProvider';
import { localeHref } from '@/lib/i18n';

// Ссылки и фото слайдов (текст — из словаря, по индексу).
const SLIDE_META = [
  { href: '/catalog', image: '/banners/2.jpg' },
  { href: '/catalog', image: '/banners/1.jpg' },
  { href: '/catalog/sorokonizhky', image: '/banners/3.jpg' },
];

export function HomeBanner() {
  const t = useT();
  const locale = useLocale();
  const SLIDES = t.banner.map((s, idx) => ({
    ...s,
    href: SLIDE_META[idx]?.href ?? '/catalog',
    image: SLIDE_META[idx]?.image ?? '/banners/1.jpg',
  }));
  const [i, setI] = useState(0);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const n = SLIDES.length;

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  const go = (d: number) => setI((v) => (v + d + n) % n);

  return (
    <section className="relative mt-2 overflow-hidden rounded-3xl border border-ink-800 bg-ink-900">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {SLIDES.map((s, idx) => (
          <div key={idx} className="relative min-w-full bg-ink-900">
            {!broken[idx] && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={s.image}
                alt=""
                onError={() => setBroken((b) => ({ ...b, [idx]: true }))}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {/* Тёмный оверлей для читаемости текста */}
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/55 to-ink-950/10" />
            <div className="relative flex min-h-[240px] flex-col justify-center px-6 py-10 sm:min-h-[340px] sm:px-12">
              <h2 className="max-w-lg text-2xl font-extrabold leading-tight drop-shadow sm:text-4xl">
                {s.title}
              </h2>
              <p className="mt-2 max-w-md text-sm [color:#e7efe9] drop-shadow sm:text-base">
                {s.subtitle}
              </p>
              <Link
                href={localeHref(locale, s.href)}
                className="mt-5 inline-flex w-fit rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
              >
                {s.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Стрелки */}
      <button
        onClick={() => go(-1)}
        aria-label="Попередній слайд"
        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/70"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Наступний слайд"
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/70"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </button>

      {/* Точки */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Слайд ${idx + 1}`}
            onClick={() => setI(idx)}
            className={
              'h-2 rounded-full transition-all ' +
              (idx === i ? 'w-6 bg-brand' : 'w-2 bg-white/50 hover:bg-white/80')
            }
          />
        ))}
      </div>
    </section>
  );
}
