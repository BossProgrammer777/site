import { NextRequest, NextResponse } from 'next/server';
import { forceRefresh } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// Ручной сброс кэша (например, по крону или после правок в таблице).
// Защищён токеном REVALIDATE_TOKEN, если он задан.
export async function POST(req: NextRequest) {
  const token = process.env.REVALIDATE_TOKEN;
  if (token) {
    const provided =
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      req.nextUrl.searchParams.get('token');
    if (provided !== token) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }
  const catalog = await forceRefresh();
  const total = catalog.sections.reduce((n, s) => n + s.products.length, 0);
  return NextResponse.json({ ok: true, source: catalog.source, total });
}
