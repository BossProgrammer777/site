import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CartProvider } from '@/components/cart/CartContext';
import { Analytics } from '@/components/Analytics';
import { siteUrl, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'Bootsbaza — футбольне взуття та екіпіровка',
    template: '%s — Bootsbaza',
  },
  description: SITE_DESCRIPTION,
  keywords: ['бутси', 'сороконіжки', 'футзалки', 'футбольна екіпіровка', 'Bootsbaza'],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'Bootsbaza — футбольне взуття та екіпіровка',
    description: SITE_DESCRIPTION,
    locale: 'uk_UA',
    images: ['/logo.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bootsbaza',
    description: SITE_DESCRIPTION,
  },
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
        <Analytics />
      </body>
    </html>
  );
}
