import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // /api/img — прокси фото товаров: ОБЯЗАТЕЛЬНО открыт для роботов, иначе
      // Google не видит картинки карточек (и картинку в Product-схеме).
      // Более длинное правило Allow перекрывает Disallow: /api/.
      allow: ['/', '/api/img'],
      disallow: ['/api/', '/cart', '/checkout'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
