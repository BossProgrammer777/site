import { getCatalog } from '@/lib/cache';
import { Logo } from '@/components/Logo';
import { CatalogBrowser } from '@/components/CatalogBrowser';

// Данные подтягиваются на сервере из кэша (фоновое обновление раз в 5 мин).
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const catalog = await getCatalog();
  const totalProducts = catalog.sections.reduce((n, s) => n + s.products.length, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      {/* Шапка */}
      <header className="sticky top-0 z-30 -mx-4 flex items-center justify-between border-b border-ink-800 bg-ink-950/85 px-4 py-3 backdrop-blur">
        <Logo />
        <span className="hidden text-xs font-medium text-ink-600 [color:#7d8f83] sm:block">
          Футбольне взуття та екіпіровка
        </span>
      </header>

      {/* Герой */}
      <section className="py-8 sm:py-12">
        <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
          Бутси, сороконіжки та екіпіровка —{' '}
          <span className="text-brand">завжди актуальна наявність</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-ink-600 [color:#9fb3a6] sm:text-base">
          Великий вибір футбольного взуття та екіпіровки — брендові моделі та бюджетні варіанти
          без бренду. Розміри в наявності, розмірна сітка та ціни оновлюються автоматично.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-ink-800 px-3 py-1.5 text-ink-600 [color:#c3d3c8] ring-1 ring-ink-700">
            {catalog.sections.length} розділів
          </span>
          <span className="rounded-full bg-ink-800 px-3 py-1.5 text-ink-600 [color:#c3d3c8] ring-1 ring-ink-700">
            {totalProducts} товарів
          </span>
          <span className="rounded-full bg-brand/15 px-3 py-1.5 font-medium text-brand ring-1 ring-brand/30">
            Актуальна наявність
          </span>
        </div>
      </section>

      <CatalogBrowser sections={catalog.sections} />

      <footer className="mt-16 border-t border-ink-800 pt-6 text-center text-xs text-ink-600 [color:#6b7d71]">
        © {new Date().getFullYear()} Bootsbaza — інтернет-магазин футбольної екіпіровки.
      </footer>
    </main>
  );
}
