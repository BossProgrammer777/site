'use client';

// Страница 404 внутри layout сайта ([lang]/layout.tsx уже рисует <html>/<body>).
// Без этого файла notFound() из страниц товара/категории отдавал стандартную
// заглушку Next со своим <html> — в браузере она падала (HierarchyRequestError)
// и человек видел белый экран. Статус ответа остаётся 404, noindex Next ставит сам.

import { usePathname } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { LocaleLink } from '@/components/LocaleLink';
import { useLocale } from '@/components/LocaleProvider';

export default function NotFound() {
  const ru = useLocale() === 'ru';
  const isProduct = (usePathname() || '').includes('/product/');

  const title = isProduct
    ? ru ? 'Товар не найден' : 'Товар не знайдено'
    : ru ? 'Страница не найдена' : 'Сторінку не знайдено';
  const text = isProduct
    ? ru
      ? 'Возможно, этот товар уже закончился или его адрес изменился. Посмотрите похожие модели в каталоге или воспользуйтесь поиском вверху страницы.'
      : 'Можливо, цей товар уже закінчився або його адреса змінилася. Перегляньте схожі моделі в каталозі або скористайтеся пошуком угорі сторінки.'
    : ru
      ? 'Такой страницы нет. Перейдите в каталог или воспользуйтесь поиском вверху страницы.'
      : 'Такої сторінки немає. Перейдіть до каталогу або скористайтеся пошуком угорі сторінки.';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-16 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">404</p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl [color:#9fb0a5]">{text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LocaleLink
            href="/catalog"
            className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
          >
            {ru ? 'Перейти в каталог' : 'Перейти до каталогу'}
          </LocaleLink>
          <LocaleLink
            href="/"
            className="rounded-xl border border-ink-700 px-6 py-3 text-sm font-bold transition hover:border-brand hover:text-brand"
          >
            {ru ? 'На главную' : 'На головну'}
          </LocaleLink>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
