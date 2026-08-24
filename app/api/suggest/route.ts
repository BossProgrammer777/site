import { NextRequest, NextResponse } from 'next/server';
import { getPublicCatalog } from '@/lib/cache';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Компактная подсказка для автодополнения в шапке.
interface Suggestion {
  slug: string;
  name: string;
  group: string | null;
  price: number;
  image: string | null;
}

// Нормализуем строку для нестрогого сравнения (регистр, ё→е, лишние пробелы).
function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get('q') || '').trim();
  const q = norm(raw);
  if (q.length < 2) {
    return NextResponse.json({ items: [] as Suggestion[] });
  }

  // Разбиваем запрос на слова — товар должен содержать все слова (в любом порядке).
  const words = q.split(' ').filter(Boolean);

  const catalog = await getPublicCatalog();

  // Собираем все товары из всех разделов, убираем дубли по slug.
  const seen = new Set<string>();
  const scored: { p: Product; score: number }[] = [];

  for (const section of catalog.sections) {
    for (const p of section.products) {
      if (seen.has(p.slug)) continue;
      const hay = norm(`${p.name} ${p.group || ''} ${p.code || ''}`);
      if (!words.every((w) => hay.includes(w))) continue;
      seen.add(p.slug);

      // Небольшое ранжирование: совпадение с начала названия — выше.
      const name = norm(p.name);
      let score = 0;
      if (name.startsWith(q)) score += 100;
      if (name.includes(q)) score += 50;
      if (norm(p.group || '').includes(q)) score += 20;
      score -= name.length * 0.01; // при равенстве — короче название выше
      scored.push({ p, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const items: Suggestion[] = scored.slice(0, 8).map(({ p }) => ({
    slug: p.slug,
    name: p.name,
    group: p.group,
    price: p.finalPrice,
    image: p.image,
  }));

  return NextResponse.json(
    { items },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' } },
  );
}
