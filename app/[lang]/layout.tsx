import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { CartProvider } from '@/components/cart/CartContext';
import { FavoritesProvider } from '@/components/favorites/FavoritesContext';
import { Analytics } from '@/components/Analytics';
import { siteUrl, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';
import { organizationJsonLd, websiteJsonLd, jsonLdScript } from '@/lib/seo';
import { LOCALES, isLocale, type Locale } from '@/lib/i18n';
import { LocaleProvider } from '@/components/LocaleProvider';

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

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  if (!isLocale(params.lang)) notFound();

  return (
    <html lang={params.lang}>
      <body className="min-h-screen antialiased">
        <LocaleProvider locale={params.lang as Locale}>
          <FavoritesProvider>
            <CartProvider>{children}</CartProvider>
          </FavoritesProvider>
        </LocaleProvider>
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(websiteJsonLd()) }}
        />
      </body>
    </html>
  );
}
