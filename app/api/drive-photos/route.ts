import { NextRequest, NextResponse } from 'next/server';
import { listFolderMedia } from '@/lib/drive';

export const dynamic = 'force-dynamic';

// Возвращает фото (для галереи) и ссылку на видео (для кнопки) из папки Drive.
// Пусто, если Drive API недоступен/выключен.
export async function GET(req: NextRequest) {
  const folder = req.nextUrl.searchParams.get('folder') || '';
  if (!folder) return NextResponse.json({ images: [], video: null });

  const { imageIds, videoIds } = await listFolderMedia(folder);
  // Фото проксируем через /api/img (сервер тянет с lh3-CDN и стримит).
  const images = imageIds.map(
    (id) => `/api/img?src=${encodeURIComponent(`https://lh3.googleusercontent.com/d/${id}=w1200`)}`,
  );
  // Видео — embed-ссылка для встроенного плеера (iframe) на самой странице.
  const video = videoIds[0] ? `https://drive.google.com/file/d/${videoIds[0]}/preview` : null;

  return NextResponse.json(
    { images, video },
    { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400' } },
  );
}
