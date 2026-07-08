import { SiteHeader } from '@/components/SiteHeader';
import { CartView } from '@/components/cart/CartView';

export const metadata = { title: 'Кошик — Bootsbaza' };

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">Кошик</h1>
        <CartView />
      </main>
    </>
  );
}
