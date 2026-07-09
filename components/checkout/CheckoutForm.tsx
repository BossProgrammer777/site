'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart, formatUAH } from '../cart/CartContext';
import { LocaleLink } from '../LocaleLink';
import { useLocale, useT } from '../LocaleProvider';
import { localizeProductName } from '@/lib/productL10n';

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
  const t = useT();
  const locale = useLocale();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [payment, setPayment] = useState<'cod' | 'prepay'>('cod');
  const paymentLabel =
    payment === 'cod'
      ? locale === 'ru'
        ? 'Наложенный платёж'
        : 'Накладений платіж'
      : locale === 'ru'
        ? 'Предоплата на счёт'
        : 'Передоплата на рахунок';

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
      setError(t.checkout.errName);
      return;
    }
    if (!cityQuery.trim() || !warehouse.trim()) {
      setError(t.checkout.errCity);
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
          payment: paymentLabel,
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
      if (!res.ok || !data.ok) throw new Error(data.error || t.checkout.sendError);
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
        <h2 className="text-xl font-extrabold">{t.checkout.doneTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm [color:#9fb3a6]">{t.checkout.doneText}</p>
        <LocaleLink
          href="/catalog"
          className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
        >
          {t.cart.continueShopping}
        </LocaleLink>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-800 bg-ink-900/50 py-16 text-center">
        <p className="[color:#9fb3a6]">{t.checkout.emptyCart}</p>
        <LocaleLink href="/catalog" className="mt-5 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 hover:bg-brand-400">
          {t.cart.toCatalog}
        </LocaleLink>
      </div>
    );
  }

  const inputCls =
    'w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm [color:#e7efe9] outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/40';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="space-y-4">
        <Field label={t.checkout.name}>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.checkout.namePh} />
        </Field>
        <Field label={t.checkout.phone}>
          <input
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+380 XX XXX XX XX"
            inputMode="tel"
          />
        </Field>

        <Field label={t.checkout.city}>
          <div className="relative">
            <input
              className={inputCls}
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setCitySelected(false);
                setCityRef('');
              }}
              placeholder={t.checkout.cityPh}
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
                      {c.area && <span className="text-xs [color:#7d8f83]">{c.area} {t.checkout.region}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>

        <Field label={t.checkout.warehouse}>
          {manual ? (
            <input
              className={inputCls}
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              placeholder={t.checkout.warehousePh}
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
                  ? t.checkout.loading
                  : cityRef
                    ? t.checkout.pickWh
                    : t.checkout.pickCityFirst}
              </option>
              {warehouses.map((w) => (
                <option key={w.ref} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label={t.checkout.payment}>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['cod', t.checkout.payCod],
                ['prepay', t.checkout.payPrepay],
              ] as const
            ).map(([val, label]) => (
              <label
                key={val}
                className={
                  'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ' +
                  (payment === val
                    ? 'border-brand bg-brand/10 [color:#e7efe9]'
                    : 'border-ink-700 bg-ink-900 [color:#c3d3c8] hover:border-brand/40')
                }
              >
                <input
                  type="radio"
                  name="payment"
                  value={val}
                  checked={payment === val}
                  onChange={() => setPayment(val)}
                  className="h-4 w-4 shrink-0 accent-brand"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label={t.checkout.comment}>
          <textarea
            className={inputCls}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.checkout.commentPh}
          />
        </Field>

        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-400 disabled:opacity-60"
        >
          {submitting ? t.checkout.submitting : `${t.checkout.confirm} · ${formatUAH(total)}`}
        </button>
      </form>

      {/* Сводка заказа */}
      <aside className="lg:sticky lg:top-[80px] h-fit rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide [color:#c3d3c8]">
          {t.checkout.yourOrder}
        </h2>
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.key} className="flex justify-between gap-2 [color:#c3d3c8]">
              <span className="min-w-0 truncate">
                {localizeProductName(i.name, locale)}{' '}
                <span className="[color:#7d8f83]">· р.{i.size} × {i.qty}</span>
              </span>
              <span className="shrink-0 font-semibold">{formatUAH(i.qty * i.price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-ink-800 pt-3">
          <span className="text-sm [color:#c3d3c8]">{t.cart.total}</span>
          <span className="text-xl font-extrabold text-brand">{formatUAH(total)}</span>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-xs [color:#7d8f83]">
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="6" width="13" height="10" rx="1" />
            <path d="M14 9h4l3 3v4h-7z" />
            <circle cx="6" cy="18" r="1.6" />
            <circle cx="18" cy="18" r="1.6" />
          </svg>
          {t.checkout.deliveryNote}
        </p>
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
