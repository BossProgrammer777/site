import { NextRequest, NextResponse } from 'next/server';
import { listFolderImages } from '@/lib/drive';

export const dynamic = 'force-dynamic';

// Возвращает список URL картинок из публичной папки Google Drive для галереи
// товара. Пусто, если Drive API недоступен/выключен.
export async function GET(req: NextRequest) {
  const folder = req.nextUrl.searchParams.get('folder') || '';
  if (!folder) return NextResponse.json({ images: [] });
  const ids = await listFolderImages(folder);
  // lh3 — публичный CDN Google для файлов Drive (быстро, без hotlink-проблем).
  const images = ids.map((id) => `https://lh3.googleusercontent.com/d/${id}=w1200`);
  return NextResponse.json(
    { images },
    { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400' } },
  );
}
