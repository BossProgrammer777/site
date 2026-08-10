import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ReviewsGrid } from '@/components/ReviewsGrid';
import { altMeta, Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  const ru = params.lang === 'ru';
  const title = ru ? 'Отзывы клиентов — Bootsbaza' : 'Відгуки клієнтів — Bootsbaza';
  const description = ru
    ? 'Реальные отзывы наших клиентов из Instagram Direct: скриншоты и видео. Доставка Новой Почтой, оплата при получении.'
    : 'Реальні відгуки наших клієнтів з Instagram Direct: скріншоти та відео. Доставка Новою Поштою, оплата при отриманні.';
  return { title, description, alternates: altMeta(params.lang, '/reviews') };
}

export default function ReviewsPage({ params }: { params: { lang: Locale } }) {
  const ru = params.lang === 'ru';
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <h1 className="mb-1 text-2xl font-extrabold sm:text-3xl">
          {ru ? 'Отзывы клиентов' : 'Відгуки клієнтів'}
        </h1>
        <p className="mb-6 max-w-2xl text-sm [color:#9fb3a6]">
          {ru
            ? 'Настоящие отзывы из Instagram Direct — скриншоты и видео от реальных покупателей. Спасибо, что выбираете нас! 💚'
            : 'Справжні відгуки з Instagram Direct — скріншоти та відео від реальних покупців. Дякуємо, що обираєте нас! 💚'}
        </p>
        <ReviewsGrid />
      </main>
      <SiteFooter />
    </>
  );
}
