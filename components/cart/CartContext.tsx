'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
export { formatUAH } from '@/lib/format';

export interface CartItem {
  key: string; // productId + size
  productId: string;
  name: string;
  code: string;
  price: number; // финальная цена за единицу
  size: string;
  sectionLabel: string;
  image: string | null;
  qty: number;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: Omit<CartItem, 'key' | 'qty'>, qty?: number) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = 'bootsbaza_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // Загрузка из localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  // Сохранение.
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const value = useMemo<CartCtx>(() => {
    const add: CartCtx['add'] = (item, qty = 1) => {
      const key = `${item.productId}__${item.size}`;
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.key === key);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: next[idx].qty + qty };
          return next;
        }
        return [...prev, { ...item, key, qty }];
      });
    };
    const remove: CartCtx['remove'] = (key) => setItems((p) => p.filter((i) => i.key !== key));
    const setQty: CartCtx['setQty'] = (key, qty) =>
      setItems((p) =>
        p
          .map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i))
          .filter((i) => i.qty > 0),
      );
    const clear = () => setItems([]);
    const count = items.reduce((n, i) => n + i.qty, 0);
    const total = items.reduce((n, i) => n + i.qty * i.price, 0);
    return { items, count, total, add, remove, setQty, clear };
  }, [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
