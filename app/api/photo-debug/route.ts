import { NextRequest, NextResponse } from 'next/server';
import { debugSheetImages } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

// Временный диагностический роут: показывает, у каких товаров листа есть
// привязанное фото и совпадают ли номера строк картинок с товарами.
// Пример: /api/photo-debug?s=butsy
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('s') || 'butsy';
  const data = await debugSheetImages(slug);
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
