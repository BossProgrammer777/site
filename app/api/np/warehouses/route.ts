import { NextRequest, NextResponse } from 'next/server';
import { getWarehouses, npConfigured } from '@/lib/novaposhta';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref') || '';
  if (!npConfigured()) return NextResponse.json({ configured: false, items: [] });
  try {
    const items = await getWarehouses(ref);
    return NextResponse.json({ configured: true, items });
  } catch (e) {
    return NextResponse.json({ configured: true, items: [], error: (e as Error).message });
  }
}
