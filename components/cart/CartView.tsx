'use client';

import Link from 'next/link';
import { useCart, formatUAH } from './CartContext';

const PLACEHOLDER = '/placeholder.svg';
function imageSrc(image: string | null): string {
  if (!image) return PLACEHOLDER;
  if (image.startsWith('data:') || image.startsWith('/')) return image;
  if (image.startsWith('http')) return `/api/img?src=${encodeURIComponent(image)}`;
  return PLACEHOLDER;
}

export function CartView() {
  const { items, total, setQty, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-800 bg-ink-900/50 py-16 text-center">
        <p className="text-ink-600 [color:#9fb3a6]">Ваш кошик порожній.</p>
        <Link
          href="/catalog"
          className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
        >
          До каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-3">
        {items.map((it) => (
          <li
            key={it.key}
            className="flex gap-4 rounded-2xl border border-ink-800 bg-ink-900/60 p-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc(it.image)}
              alt={it.name}
              className="h-20 w-20 shrink-0 rounded-xl object-cover bg-ink-800"
            />
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-semibold [color:#e7efe9]">{it.name}</h3>
              <p className="mt-0.5 text-xs [color:#7d8f83]">
                Код: {it.code} · Розмір: <span className="text-brand">{it.size}</span>
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(it.key, it.qty - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-800 text-lg [color:#c3d3c8] hover:bg-ink-700"
                    aria-label="Менше"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{it.qty}</span>
                  <button
                    onClick={() => setQty(it.key, it.qty + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-800 text-lg [color:#c3d3c8] hover:bg-ink-700"
                    aria-label="Більше"
                  >
                    +
                  </button>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-brand">{formatUAH(it.qty * it.price)}</div>
                  <button
                    onClick={() => remove(it.key)}
                    className="text-xs [color:#7d8f83] hover:text-red-400"
                  >
                    Видалити
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="lg:sticky lg:top-[80px] h-fit rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <div className="flex items-center justify-between text-sm [color:#c3d3c8]">
          <span>Разом</span>
          <span className="text-xl font-extrabold text-brand">{formatUAH(total)}</span>
        </div>
        <Link
          href="/checkout"
          className="mt-4 block rounded-xl bg-brand px-6 py-3 text-center text-sm font-bold text-ink-950 transition hover:bg-brand-400"
        >
          Оформити замовлення
        </Link>
        <Link
          href="/catalog"
          className="mt-2 block text-center text-xs [color:#7d8f83] hover:text-brand"
        >
          Продовжити покупки
        </Link>
      </aside>
    </div>
  );
}
