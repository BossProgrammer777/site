import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

// Обёртка для информационных страниц (единый стиль текста).
export function InfoPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-8 pt-8">
        <h1 className="mb-6 text-3xl font-extrabold sm:text-4xl">{title}</h1>
        <div className="info-content space-y-4 text-sm leading-relaxed [color:#c3d3c8] sm:text-base">
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
