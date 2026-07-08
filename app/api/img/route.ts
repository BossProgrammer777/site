import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Прокси картинок товара: скрывает источник и обходит hotlink/CORS-ограничения
// Google. Принимает только http(s)-URL Google-хостов. При ошибке возвращает 302
// на статический плейсхолдер, чтобы страница не ломалась.
const ALLOWED_HOSTS = [
  'googleusercontent.com',
  'lh3.googleusercontent.com',
  'drive.google.com',
  'docs.google.com',
];

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('src');
  if (!src) return NextResponse.redirect(new URL('/placeholder.svg', req.url));

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return NextResponse.redirect(new URL('/placeholder.svg', req.url));
  }
  const ok =
    (url.protocol === 'https:' || url.protocol === 'http:') &&
    ALLOWED_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
  if (!ok) return NextResponse.redirect(new URL('/placeholder.svg', req.url));

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok || !res.body) {
      return NextResponse.redirect(new URL('/placeholder.svg', req.url));
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return new NextResponse(res.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return NextResponse.redirect(new URL('/placeholder.svg', req.url));
  }
}
