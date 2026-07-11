import { NextRequest, NextResponse } from 'next/server';
import { getCatalog } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ЗАКРЫТЫЙ эндпоинт: по коду товара отдаёт дроп-цену (закупку) и см для размера —
// только для учёта заказов (бот пишет их в приватную Google-таблицу). Требует
// заголовок x-order-key = ORDER_META_KEY. Наружу/покупателям НЕ доступен.

/** Достаёт см (по вкладке «Б-XX см») из строки размерной сетки для нужного EU. */
function cmForSize(sizeGrid: string[], size: string): number | null {
  const want = (size || '').replace(',', '.').trim();
  if (!want) return null;
  for (const rowStr of sizeGrid) {
    const parts = rowStr.split('|');
    const euPart = parts.find((p) => /eu/i.test(p)) || parts[0] || '';
    const eu = (euPart.match(/(\d+(?:[.,]\d+)?)/)?.[1] || '').replace(',', '.');
    if (eu && eu === want) {
      // «Б-24,5 см» → 24.5; если нет «Б», берём первое число «см».
      const bMatch = rowStr.match(/Б[\s-]*([\d]+(?:[.,]\d+)?)\s*см/i);
      const anyCm = rowStr.match(/([\d]+(?:[.,]\d+)?)\s*см/i);
      const val = (bMatch?.[1] || anyCm?.[1] || '').replace(',', '.');
      return val ? Number(val) : null;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const key = process.env.ORDER_META_KEY;
  if (!key || req.headers.get('x-order-key') !== key) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const code = (req.nextUrl.searchParams.get('code') || '').trim();
  const size = (req.nextUrl.searchParams.get('size') || '').trim();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const catalog = await getCatalog();
  const drop = catalog.dropByCode?.[code] ?? null;

  let cm: number | null = null;
  for (const s of catalog.sections) {
    const p = s.products.find((x) => x.code === code);
    if (p) {
      cm = size ? cmForSize(p.sizeGrid, size) : null;
      break;
    }
  }

  return NextResponse.json({ code, drop, cm });
}
