import { NextResponse } from 'next/server';
import { listFolderMedia } from '@/lib/drive';
import { REVIEWS_FOLDER_ID } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

// Отдаёт отзывы клиентов из Drive-папки: скрины (images) и видео (videos).
// Фото проксируем через /api/img; видео — thumbnail + embed-ссылка для плеера.
export async function GET() {
  const { imageIds, videoIds } = await listFolderMedia(REVIEWS_FOLDER_ID);

  const images = imageIds.map(
    (id) => `/api/img?src=${encodeURIComponent(`https://lh3.googleusercontent.com/d/${id}=w1000`)}`,
  );
  const videos = videoIds.map((id) => ({
    thumb: `/api/img?src=${encodeURIComponent(`https://lh3.googleusercontent.com/d/${id}=w600`)}`,
    preview: `https://drive.google.com/file/d/${id}/preview`,
  }));

  return NextResponse.json(
    { images, videos },
    { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400' } },
  );
}
