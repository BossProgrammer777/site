import { NextRequest, NextResponse } from 'next/server';
import { searchCities, npConfigured } from '@/lib/novaposhta';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  if (!npConfigured()) return NextResponse.json({ configured: false, items: [] });
  try {
    const items = await searchCities(q);
    return NextResponse.json({ configured: true, items });
  } catch (e) {
    return NextResponse.json({ configured: true, items: [], error: (e as Error).message });
  }
}
