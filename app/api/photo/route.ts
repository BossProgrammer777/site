import { NextRequest, NextResponse } from 'next/server';
import { sheetBySlug } from '@/lib/config';
import { getSheetPhoto } from '@/lib/xlsxImages';

export const dynamic = 'force-dynamic';

// Отдаёт вставленное в ячейку фото товара по (раздел, строка). Байты
// извлекаются из .xlsx-экспорта и кэшируются в памяти. Если фото нет или
// экспорт недоступен (напр. docs.google.com заблокирован) — плейсхолдер.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('s') || '';
  const row = Number(req.nextUrl.searchParams.get('r'));
  const sheet = sheetBySlug(slug);
  const placeholder = NextResponse.redirect(new URL('/placeholder.svg', req.url));

  if (!sheet || !Number.isFinite(row)) return placeholder;

  try {
    const img = await getSheetPhoto(sheet.title, row);
    if (!img) return placeholder;
    return new NextResponse(Buffer.from(img.bytes), {
      headers: {
        'Content-Type': img.contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return placeholder;
  }
}
