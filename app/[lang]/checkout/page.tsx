import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export const metadata = { title: 'Оформлення замовлення — Bootsbaza', robots: { index: false, follow: true } };

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <h1 className="mb-6 text-2xl font-extrabold sm:text-3xl">Оформлення замовлення</h1>
        <CheckoutForm />
      </main>
      <SiteFooter />
    </>
  );
}
