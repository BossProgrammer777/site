import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/components/cart/CartContext';

export const metadata: Metadata = {
  title: 'Bootsbaza — футбольна екіпіровка та бутси',
  description:
    'Bootsbaza — інтернет-магазин футбольного взуття та екіпірування: бутси, сороконіжки, футзалки, дитяче взуття. Актуальна наявність розмірів та ціни.',
  keywords: ['бутси', 'сороконіжки', 'футзалки', 'футбольна екіпіровка', 'Bootsbaza'],
};

export const viewport: Viewport = {
  themeColor: '#0a0d0b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="min-h-screen antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
