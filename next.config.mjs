/** @type {import('next').NextConfig} */

// Кэш готовых страниц на CDN Vercel на 5 минут (как и кэш прайса в памяти):
// повторные заходы людей и ботов не запускают функцию и не тратят процессор.
// Рендер страниц не меняется (force-dynamic). Заголовок Vercel-CDN-Cache-Control
// действует только на CDN Vercel и в браузер не уходит. Корзина, оформление и
// /api сюда не входят.
const CDN_PAGE_CACHE = [{ key: 'Vercel-CDN-Cache-Control', value: 's-maxage=300, stale-while-revalidate=3600' }];
const CACHED_PAGES = [
  '/',
  '/ru',
  '/catalog',
  '/catalog/:path*',
  '/ru/catalog',
  '/ru/catalog/:path*',
  '/product/:path*',
  '/ru/product/:path*',
  '/reviews',
  '/ru/reviews',
];

const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  async headers() {
    return CACHED_PAGES.map((source) => ({ source, headers: CDN_PAGE_CACHE }));
  },
};
export default nextConfig;
