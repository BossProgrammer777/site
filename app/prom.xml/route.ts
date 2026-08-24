import { getPublicCatalog } from '@/lib/cache';
import { buildPromXml } from '@/lib/promFeed';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Товарный фид для Prom.ua (автоимпорт по ссылке).
// URL: https://<домен>/prom.xml
export async function GET() {
  const catalog = await getPublicCatalog();
  const xml = buildPromXml(catalog);
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Prom забирает фид по расписанию; недолгий кэш на CDN — этого достаточно.
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
    },
  });
}
