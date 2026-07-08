'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { useCart, formatUAH } from './cart/CartContext';
import { FavoriteButton } from './favorites/FavoriteButton';
import { productImageSrc, PLACEHOLDER } from '@/lib/img';

function folderId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const baseImages = product.image ? [productImageSrc(product.image)] : [];
  const [images, setImages] = useState<string[]>(baseImages.length ? baseImages : [PLACEHOLDER]);
  const [mainIdx, setMainIdx] = useState(0);
  const [mainBroken, setMainBroken] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);

  // Подгружаем доп. фото и видео из папки Google Drive (если Drive API доступен).
  useEffect(() => {
    const fid = folderId(product.mediaUrl);
    if (!fid) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/drive-photos?folder=${encodeURIComponent(fid)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.video) setVideoUrl(data.video);
        if (Array.isArray(data.images) && data.images.length > 0) {
          setImages((prev) => {
            const merged = [...prev.filter((u) => u !== PLACEHOLDER), ...data.images];
            return Array.from(new Set(merged));
          });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product.mediaUrl]);

  const inStock = product.sizes.filter((s) => s.inStock);
  const [size, setSize] = useState<string | null>(inStock.length === 1 ? inStock[0].label : null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (!size) return;
    add(
      {
        productId: product.id,
        name: product.name,
        code: product.code,
        price: product.finalPrice,
        size,
        sectionLabel: '',
        image: product.image,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  // Для интерактивной размерной сетки: наличие по размеру + EU-размер из строки.
  const stockByLabel = new Map(product.sizes.map((s) => [s.label, s.inStock]));
  const rowEu = (row: string): string | null => {
    const m = row.match(/EU[\s.-]*?(\d{2})/i);
    return m ? m[1] : null;
  };

  return (
    <>
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Галерея */}
      <div>
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-ink-800 bg-white/95 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainBroken ? PLACEHOLDER : images[mainIdx] || PLACEHOLDER}
            alt={product.name}
            onError={() => setMainBroken(true)}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Миниатюры */}
        {images.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {images.map((src, i) => (
              <button
                key={src}
                onClick={() => {
                  setMainIdx(i);
                  setMainBroken(false);
                }}
                className={
                  'h-16 w-16 overflow-hidden rounded-lg border-2 bg-white/95 transition ' +
                  (i === mainIdx ? 'border-brand' : 'border-ink-700 hover:border-brand/50')
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" className="h-full w-full object-contain p-0.5" />
              </button>
            ))}
          </div>
        )}

        {videoUrl ? (
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand transition hover:bg-brand/20"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Дивитися відео
          </button>
        ) : (
          product.mediaUrl && (
            <a
              href={product.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand transition hover:bg-brand/20"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Більше фото та відео
            </a>
          )
        )}
      </div>

      {/* Информация */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{product.name}</h1>
          <FavoriteButton
            id={product.id}
            className="mt-1 h-10 w-10 shrink-0 border border-ink-700 bg-ink-900"
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm [color:#7d8f83]">
          {product.code && <span>Код: {product.code}</span>}
          {product.country && <span>Країна: {product.country}</span>}
        </div>

        <div className="mt-4 text-3xl font-extrabold text-brand">
          {formatUAH(product.finalPrice)}
        </div>

        {/* Размеры */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold [color:#c3d3c8]">
            Розмір {size && <span className="text-brand">· обрано {size}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const sel = size === s.label;
              return (
                <button
                  key={s.label}
                  type="button"
                  disabled={!s.inStock}
                  onClick={() => setSize(s.label)}
                  className={
                    'inline-flex min-w-[2.6rem] items-center justify-center rounded-lg px-2.5 py-2 text-sm font-semibold transition ' +
                    (!s.inStock
                      ? 'cursor-not-allowed bg-ink-800 [color:#5a6b60] ring-1 ring-ink-700 line-through'
                      : sel
                        ? 'bg-brand text-ink-950 ring-1 ring-brand'
                        : 'bg-brand/15 text-brand ring-1 ring-brand/40 hover:bg-brand/25')
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Количество + в корзину */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-ink-700 bg-ink-900">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-11 w-11 items-center justify-center text-lg [color:#c3d3c8] hover:text-brand"
              aria-label="Менше"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold">{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="flex h-11 w-11 items-center justify-center text-lg [color:#c3d3c8] hover:text-brand"
              aria-label="Більше"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={!size}
            className={
              'flex-1 rounded-xl px-6 py-3 text-sm font-bold transition ' +
              (added
                ? 'bg-brand-600 text-white'
                : size
                  ? 'bg-brand text-ink-950 hover:bg-brand-400'
                  : 'cursor-not-allowed bg-ink-800 [color:#5a6b60]')
            }
          >
            {added ? '✓ Додано в кошик' : size ? 'Додати в кошик' : 'Оберіть розмір'}
          </button>
        </div>

        {added && (
          <Link href="/cart" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
            Перейти до кошика →
          </Link>
        )}

        {product.notes && (
          <p className="mt-5 rounded-xl bg-ink-900/60 p-3 text-sm [color:#9fb3a6]">{product.notes}</p>
        )}

        {/* Размерная сетка (интерактивная) */}
        {product.sizeGrid.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide [color:#c3d3c8]">
              Розмірна сітка
            </h2>
            <p className="mb-2 text-xs [color:#7d8f83]">
              Натисніть на розмір вище або на рядок сітки — потрібний розмір виділиться.
            </p>
            <div className="overflow-x-auto rounded-xl border border-ink-800">
              <table className="w-full text-left text-xs sm:text-sm">
                <tbody>
                  {product.sizeGrid.map((row, i) => {
                    const eu = rowEu(row);
                    const inStk = eu ? stockByLabel.get(eu) === true : false;
                    const selectable = !!eu && inStk;
                    const highlighted = !!eu && eu === size;
                    const outOfStock = !!eu && stockByLabel.get(eu) === false;
                    return (
                      <tr
                        key={i}
                        onClick={() => selectable && setSize(eu!)}
                        title={
                          selectable
                            ? `Обрати розмір ${eu}`
                            : outOfStock
                              ? `Розмір ${eu}: немає в наявності`
                              : undefined
                        }
                        className={
                          'border-b border-ink-800 last:border-0 transition ' +
                          (highlighted
                            ? 'bg-brand/20 '
                            : 'odd:bg-ink-900/40 ') +
                          (selectable
                            ? 'cursor-pointer hover:bg-brand/10 '
                            : outOfStock
                              ? 'opacity-45 '
                              : '')
                        }
                      >
                        {row.split(/[|]/).map((cell, j) => (
                          <td
                            key={j}
                            className={
                              'whitespace-nowrap px-3 py-1.5 ' +
                              (highlighted ? 'font-semibold text-brand' : '[color:#c3d3c8]')
                            }
                          >
                            {cell.trim()}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Модальный плеер видео */}
    {videoOpen && videoUrl && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        onClick={() => setVideoOpen(false)}
        role="dialog"
        aria-modal="true"
      >
        <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setVideoOpen(false)}
            aria-label="Закрити"
            className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-ink-800 text-white ring-1 ring-white/10 hover:bg-ink-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="overflow-hidden rounded-2xl border border-ink-700 bg-black">
            <iframe
              src={videoUrl}
              title="Відео товару"
              allow="autoplay; fullscreen"
              allowFullScreen
              className="aspect-video w-full"
            />
          </div>
        </div>
      </div>
    )}
    </>
  );
}
