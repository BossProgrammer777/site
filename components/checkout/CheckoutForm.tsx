'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart, formatUAH } from '../cart/CartContext';

interface City {
  ref: string;
  name: string;
  area: string;
}
interface Warehouse {
  ref: string;
  name: string;
  number: string;
}

export function CheckoutForm() {
  const { items, total, clear } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');

  // Nova Poshta
  const [manual, setManual] = useState(false); // если API не настроен
  const [cityQuery, setCityQuery] = useState('');
  const [citySelected, setCitySelected] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [cityRef, setCityRef] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouse, setWarehouse] = useState('');
  const [loadingWh, setLoadingWh] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Автопоиск городов НП.
  useEffect(() => {
    if (manual || citySelected) return;
    if (cityQuery.trim().length < 2) {
      setCities([]);
      return;
    }
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/np/cities?q=${encodeURIComponent(cityQuery.trim())}`);
        const data = await res.json();
        if (data.configured === false) {
          setManual(true);
          return;
        }
        setCities(data.items || []);
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(debounce.current);
  }, [cityQuery, manual, citySelected]);

  const pickCity = async (c: City) => {
    setCityQuery(c.name);
    setCityRef(c.ref);
    setCitySelected(true);
    setCities([]);
    setWarehouse('');
    setLoadingWh(true);
    try {
      const res = await fetch(`/api/np/warehouses?ref=${encodeURIComponent(c.ref)}`);
      const data = await res.json();
      setWarehouses(data.items || []);
    } catch {
      setWarehouses([]);
    } finally {
      setLoadingWh(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Вкажіть ім’я та коректний номер телефону.');
      return;
    }
    if (!cityQuery.trim() || !warehouse.trim()) {
      setError('Вкажіть місто та відділення Нової Пошти.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name, phone },
          delivery: { city: cityQuery, warehouse },
          comment,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            code: i.code,
            size: i.size,
            price: i.price,
            qty: i.qty,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Помилка відправки');
      clear();
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-brand/40 bg-brand/5 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-ink-950">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold">Замовлення прийнято!</h2>
        <p className="mx-auto mt-2 max-w-md text-sm [color:#9fb3a6]">
          Дякуємо! Ми зв’яжемося з вами найближчим часом для підтвердження та відправки.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
        >
          Продовжити покупки
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-800 bg-ink-900/50 py-16 text-center">
        <p className="[color:#9fb3a6]">Кошик порожній — немає що оформлювати.</p>
        <Link href="/catalog" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 hover:bg-brand-400">
          До каталогу
        </Link>
      </div>
    );
  }

  const inputCls =
    'w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm [color:#e7efe9] outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/40';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Ім’я та прізвище *">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Іван Петренко" />
        </Field>
        <Field label="Номер телефону *">
          <input
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+380 XX XXX XX XX"
            inputMode="tel"
          />
        </Field>

        <Field label="Місто *">
          <div className="relative">
            <input
              className={inputCls}
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setCitySelected(false);
                setCityRef('');
              }}
              placeholder="Почніть вводити місто…"
              autoComplete="off"
            />
            {!manual && cities.length > 0 && !citySelected && (
              <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-ink-700 bg-ink-900 shadow-xl">
                {cities.map((c) => (
                  <li key={c.ref}>
                    <button
                      type="button"
                      onClick={() => pickCity(c)}
                      className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-ink-800"
                    >
                      <span className="[color:#e7efe9]">{c.name}</span>
                      {c.area && <span className="text-xs [color:#7d8f83]">{c.area} обл.</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>

        <Field label="Відділення / поштомат Нової Пошти *">
          {manual ? (
            <input
              className={inputCls}
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              placeholder="Напр.: Відділення №5"
            />
          ) : (
            <select
              className={inputCls}
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              disabled={!cityRef || loadingWh}
            >
              <option value="">
                {loadingWh
                  ? 'Завантаження…'
                  : cityRef
                    ? 'Оберіть відділення'
                    : 'Спочатку оберіть місто'}
              </option>
              {warehouses.map((w) => (
                <option key={w.ref} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Коментар (необов’язково)">
          <textarea
            className={inputCls}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Побажання до замовлення"
          />
        </Field>

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-400 disabled:opacity-60"
        >
          {submitting ? 'Відправляємо…' : `Підтвердити замовлення · ${formatUAH(total)}`}
        </button>
      </form>

      {/* Сводка заказа */}
      <aside className="lg:sticky lg:top-[80px] h-fit rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide [color:#c3d3c8]">
          Ваше замовлення
        </h2>
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.key} className="flex justify-between gap-2 [color:#c3d3c8]">
              <span className="min-w-0 truncate">
                {i.name} <span className="[color:#7d8f83]">· р.{i.size} × {i.qty}</span>
              </span>
              <span className="shrink-0 font-semibold">{formatUAH(i.qty * i.price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-ink-800 pt-3">
          <span className="text-sm [color:#c3d3c8]">Разом</span>
          <span className="text-xl font-extrabold text-brand">{formatUAH(total)}</span>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium [color:#c3d3c8]">{label}</span>
      {children}
    </label>
  );
}
