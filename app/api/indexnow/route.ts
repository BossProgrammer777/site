import { NextRequest, NextResponse } from 'next/server';
import { indexNowSubmit, bothLocales } from '@/lib/indexnow';
import { categoryLandingSlugs } from '@/lib/seo';
import { BLOG } from '@/lib/blog';

export const dynamic = 'force-dynamic';

// Ежедневный пинг IndexNow (Vercel Cron, см. vercel.json): главная, каталог и
// категории (наличие и цены там меняются каждый день) + статьи блога,
// опубликованные/обновлённые за последние 7 дней. Изменения товаров
// отправляются отдельно — при обновлении прайса (lib/cache.ts).
// Доступ: Vercel Cron сам шлёт CRON_SECRET как Bearer-токен.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const freshArticles = BLOG.filter((a) => new Date(a.updated || a.date).getTime() >= weekAgo);

  const paths = [
    '/',
    '/catalog',
    '/blog',
    ...categoryLandingSlugs().map((s) => `/catalog/${s}`),
    ...freshArticles.map((a) => `/blog/${a.slug}`),
  ].flatMap(bothLocales);

  await indexNowSubmit(paths, 'ежедневно: главная, категории, свежие статьи');
  return NextResponse.json({ ok: true, submitted: paths.length, articles: freshArticles.map((a) => a.slug) });
}
