'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';

const PLACEHOLDER = '/placeholder.svg';

function imageSrc(image: string | null): string {
  if (!image) return PLACEHOLDER;
  if (image.startsWith('data:') || image.startsWith('/')) return image;
  if (image.startsWith('http')) return `/api/img?src=${encodeURIComponent(image)}`;
  return PLACEHOLDER;
}

function formatPrice(uah: number): string {
  return `${uah.toLocaleString('uk-UA')} грн`;
}

export function ProductCard({ product }: { product: Product }) {
  const [imgSrc, setImgSrc] = useState(imageSrc(product.image));
  const [gridOpen, setGridOpen] = useState(false);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/70 transition hover:border-brand/50 hover:shadow-glow">
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={product.name}
          loading="lazy"
          onError={() => setImgSrc(PLACEHOLDER)}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        {!product.anyInStock && (
          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-ink-600 ring-1 ring-ink-600">
            Немає в наявності
          </span>
        )}
        {product.country && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-ink-600 backdrop-blur ring-1 ring-white/5">
            {product.country}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink-600 [color:#e7efe9]">
            {product.name}
          </h3>
          {product.code && (
            <p className="mt-1 text-xs text-ink-600 [color:#7d8f83]">Код: {product.code}</p>
          )}
        </div>

        <div className="text-lg font-extrabold text-brand">{formatPrice(product.finalPrice)}</div>

        {/* Размеры бейджами */}
        <div className="flex flex-wrap gap-1.5">
          {product.sizes.map((s) => (
            <span
              key={s.label}
              title={s.inStock ? `${s.label}: у наявності` : `${s.label}: немає`}
              className={
                'inline-flex min-w-[2.1rem] items-center justify-center rounded-md px-1.5 py-1 text-xs font-semibold ' +
                (s.inStock
                  ? 'bg-brand/15 text-brand ring-1 ring-brand/40'
                  : 'bg-ink-800 text-ink-600 [color:#5a6b60] ring-1 ring-ink-700 line-through')
              }
            >
              {s.label}
            </span>
          ))}
        </div>

        {product.notes && (
          <p className="text-xs text-ink-600 [color:#9fb3a6]">{product.notes}</p>
        )}

        {/* Розмірна сітка */}
        {product.sizeGrid.length > 0 && (
          <div className="mt-auto">
            <button
              type="button"
              onClick={() => setGridOpen((v) => !v)}
              aria-expanded={gridOpen}
              className="flex w-full items-center justify-between rounded-lg bg-ink-800 px-3 py-2 text-xs font-medium text-ink-600 [color:#c3d3c8] transition hover:bg-ink-700"
            >
              <span>Розмірна сітка (EU / UK / US / см)</span>
              <svg
                className={'h-3.5 w-3.5 transition ' + (gridOpen ? 'rotate-180' : '')}
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
            {gridOpen && (
              <ul className="mt-2 space-y-1 rounded-lg bg-ink-950/60 p-3 text-xs text-ink-600 [color:#a9bcae]">
                {product.sizeGrid.map((row, i) => (
                  <li key={i} className="border-b border-ink-800 pb-1 last:border-0 last:pb-0">
                    {row}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
