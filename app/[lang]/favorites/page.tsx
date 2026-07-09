import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { FavoritesView } from '@/components/favorites/FavoritesView';
import { dict } from '@/lib/dictionaries';
import type { Locale } from '@/lib/i18n';

export const metadata = { robots: { index: false, follow: true } };

export default function FavoritesPage({ params }: { params: { lang: Locale } }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">{dict[params.lang].fav.title}</h1>
        <FavoritesView />
      </main>
      <SiteFooter />
    </>
  );
}
