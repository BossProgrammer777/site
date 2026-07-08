'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

// Слайды баннера. Чтобы поставить своё фото — задайте `image` (URL картинки в
// /public, напр. '/banners/1.jpg'); градиент останется как оверлей поверх фото.
interface Slide {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  gradient: string;
  image?: string;
}

const SLIDES: Slide[] = [
  {
    title: 'Новинки сезону',
    subtitle: 'Свіжі моделі Nike, Adidas, Puma вже в наявності',
    cta: 'Дивитися новинки',
    href: '/catalog',
    gradient: 'from-emerald-600/40 via-ink-900 to-ink-950',
  },
  {
    title: 'Вигідні ціни',
    subtitle: 'Бюджетні варіанти без бренду — якість за приємні гроші',
    cta: 'До каталогу',
    href: '/catalog?section=nb-vzuttia',
    gradient: 'from-brand/30 via-ink-900 to-ink-950',
  },
  {
    title: 'Все для гри',
    subtitle: 'Бутси, сороконіжки, футзалки та повна екіпіровка',
    cta: 'Обрати',
    href: '/catalog',
    gradient: 'from-teal-600/40 via-ink-900 to-ink-950',
  },
];

export function HomeBanner() {
  const [i, setI] = useState(0);
  const n = SLIDES.length;

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  return (
    <section className="relative mt-2 overflow-hidden rounded-3xl border border-ink-800">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {SLIDES.map((s, idx) => (
          <div key={idx} className="relative min-w-full">
            {s.image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className={`relative bg-gradient-to-br ${s.gradient}`}>
              <div className="flex min-h-[220px] flex-col justify-center px-6 py-10 sm:min-h-[300px] sm:px-12">
                <h2 className="max-w-lg text-2xl font-extrabold leading-tight sm:text-4xl">
                  {s.title}
                </h2>
                <p className="mt-2 max-w-md text-sm [color:#c3d3c8] sm:text-base">{s.subtitle}</p>
                <Link
                  href={s.href}
                  className="mt-5 inline-flex w-fit rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
                >
                  {s.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Точки */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Слайд ${idx + 1}`}
            onClick={() => setI(idx)}
            className={
              'h-2 rounded-full transition-all ' +
              (idx === i ? 'w-6 bg-brand' : 'w-2 bg-white/40 hover:bg-white/70')
            }
          />
        ))}
      </div>
    </section>
  );
}
