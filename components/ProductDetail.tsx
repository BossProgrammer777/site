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

// Текст об отправке по времени Киева: будни до 13:00 → «сьогодні», иначе —
// «наступного робочого дня». Отправка день-в-день только по будням.
function shippingText(): string {
  try {
    const kyiv = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Kyiv' }));
    const day = kyiv.getDay(); // 0 — неділя, 6 — субота
    const isWeekday = day >= 1 && day <= 5;
    if (isWeekday && kyiv.getHours() < 13) {
      return 'Відправка сьогодні при замовленні до 13:00';
    }
    return 'Відправка наступного робочого дня';
  } catch {
    return 'Швидка відправка «Новою Поштою»';
  }
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

  // Текст отправки считаем после монтирования (во избежание рассинхрона SSR/CSR).
  const [shipText, setShipText] = useState('Швидка відправка «Новою Поштою»');
  useEffect(() => setShipText(shippingText()), []);

  // Быстрый заказ «в 1 клик».
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickPhone, setQuickPhone] = useState('');
  const [quickState, setQuickState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [quickError, setQuickError] = useState('');

  const submitQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quickState === 'sending') return;
    const digits = quickPhone.replace(/\D/g, '');
    if (digits.length < 9) {
      setQuickError('Вкажіть коректний номер телефону');
      return;
    }
    setQuickError('');
    setQuickState('sending');
    try {
      const res = await fetch('/api/quick-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, size, phone: quickPhone.trim(), qty }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Помилка');
      setQuickState('ok');
    } catch (err) {
      setQuickError((err as Error).message);
      setQuickState('err');
    }
  };

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

        {/* Кнопка быстрого заказа */}
        <button
          type="button"
          onClick={() => {
            setQuickOpen(true);
            setQuickState('idle');
            setQuickError('');
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-brand/50 bg-brand/10 px-6 py-3 text-sm font-bold text-brand transition hover:bg-brand/20"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L4.5 12.5a.5.5 0 00.4.8H11l-1 8.7 8.5-10.5a.5.5 0 00-.4-.8H12l1-8.7z" />
          </svg>
          Швидке замовлення в 1 клік
        </button>

        {/* Микротекст: наличие + отправка */}
        <div className="mt-3 space-y-1.5 text-sm">
          <p className="flex items-center gap-2 font-semibold text-brand">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
            </svg>
            {size ? `Розмір ${size} в наявності` : 'В наявності'}
          </p>
          <p className="flex items-center gap-2 [color:#9fb3a6]">
            <svg className="h-4 w-4 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="6" width="13" height="10" rx="1" />
              <path d="M14 9h4l3 3v4h-7z" />
              <circle cx="6" cy="18" r="1.6" />
              <circle cx="18" cy="18" r="1.6" />
            </svg>
            {shipText}
          </p>
        </div>

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

    {/* Модалка быстрого заказа */}
    {quickOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={() => setQuickOpen(false)}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="relative w-full max-w-sm rounded-2xl border border-ink-700 bg-ink-950 p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setQuickOpen(false)}
            aria-label="Закрити"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink-800 text-white/80 hover:bg-ink-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {quickState === 'ok' ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/20 text-brand">
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold [color:#e7efe9]">Дякуємо за замовлення!</h3>
              <p className="mt-2 text-sm [color:#9fb3a6]">
                Ми зателефонуємо найближчим часом, щоб підтвердити розмір і доставку.
              </p>
              <button
                onClick={() => setQuickOpen(false)}
                className="mt-5 w-full rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
              >
                Зрозуміло
              </button>
            </div>
          ) : (
            <form onSubmit={submitQuick}>
              <h3 className="text-lg font-bold [color:#e7efe9]">Швидке замовлення</h3>
              <p className="mt-1 text-sm [color:#9fb3a6]">
                Залиште номер — ми передзвонимо й оформимо замовлення за вас.
              </p>
              <p className="mt-3 truncate text-sm font-semibold [color:#c3d3c8]">
                {product.name}
                {size && <span className="text-brand"> · розмір {size}</span>}
              </p>

              <input
                type="tel"
                inputMode="tel"
                autoFocus
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                placeholder="+38 (0__) ___-__-__"
                className="mt-4 w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm [color:#e7efe9] outline-none placeholder:[color:#6b7d71] focus:border-brand/60 focus:ring-1 focus:ring-brand/40"
              />
              {quickError && <p className="mt-2 text-sm text-red-400">{quickError}</p>}

              <button
                type="submit"
                disabled={quickState === 'sending'}
                className="mt-4 w-full rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-400 disabled:opacity-60"
              >
                {quickState === 'sending' ? 'Надсилаємо…' : 'Замовити дзвінок'}
              </button>
              <p className="mt-3 text-center text-xs [color:#6b7d71]">
                Натискаючи кнопку, ви погоджуєтесь, що з вами звʼяжеться менеджер.
              </p>
            </form>
          )}
        </div>
      </div>
    )}
    </>
  );
}
