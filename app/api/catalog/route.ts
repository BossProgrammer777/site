import { NextResponse } from 'next/server';
import { getPublicCatalog } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Отдаёт кэшированный каталог. В ответе НЕТ дроп-цены и НЕТ времени
// обновления для покупателя — только публичные поля товара с finalPrice.
export async function GET() {
  const catalog = await getPublicCatalog();
  return NextResponse.json(
    { sections: catalog.sections },
    {
      headers: {
        // Разрешаем CDN/браузеру недолго кэшировать, обновление — в фоне.
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
      },
    },
  );
}
