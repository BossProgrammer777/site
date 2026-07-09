import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { FavoritesView } from '@/components/favorites/FavoritesView';

export const metadata = { title: 'Обране', robots: { index: false, follow: true } };

export default function FavoritesPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">Обране</h1>
        <FavoritesView />
      </main>
      <SiteFooter />
    </>
  );
}
