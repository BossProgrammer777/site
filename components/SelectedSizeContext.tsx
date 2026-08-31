'use client';

import { createContext, useContext, useState } from 'react';

// Общий выбранный размер для страницы товара: карточка товара (ProductDetail)
// его выставляет, а блок «Схожі товари» читает — щоб підкидати моделі саме в
// цьому розмірі.
type Ctx = { size: string | null; setSize: (s: string | null) => void };

const SelectedSizeCtx = createContext<Ctx>({ size: null, setSize: () => {} });

export function SelectedSizeProvider({
  initial,
  children,
}: {
  initial: string | null;
  children: React.ReactNode;
}) {
  const [size, setSize] = useState<string | null>(initial);
  return <SelectedSizeCtx.Provider value={{ size, setSize }}>{children}</SelectedSizeCtx.Provider>;
}

export const useSelectedSize = () => useContext(SelectedSizeCtx);
