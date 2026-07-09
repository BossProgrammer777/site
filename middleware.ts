import { NextRequest, NextResponse } from 'next/server';

// «Prefix-as-needed»: UA (локаль по умолчанию) живёт на корне без префикса,
// поэтому запросы без /ru внутренне переписываем на /uk (URL в браузере
// остаётся чистым). /ru/* обслуживается сегментом [lang]=ru напрямую.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Уже русская локаль — отдаём как есть (сегмент [lang]=ru).
  if (pathname === '/ru' || pathname.startsWith('/ru/')) {
    return NextResponse.next();
  }

  // Остальное — украинская локаль: внутренний rewrite на /uk без смены URL.
  const url = req.nextUrl.clone();
  url.pathname = `/uk${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Исключаем api, служебные пути Next и любые файлы с расширением
  // (sitemap.xml, robots.txt, prom.xml, картинки и т.п.).
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
