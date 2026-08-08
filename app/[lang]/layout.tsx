import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { CartProvider } from '@/components/cart/CartContext';
import { FavoritesProvider } from '@/components/favorites/FavoritesContext';
import { Analytics } from '@/components/Analytics';
import { ContactWidget } from '@/components/ContactWidget';
import { siteUrl, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';
import { organizationJsonLd, websiteJsonLd, jsonLdScript } from '@/lib/seo';
import { LOCALES, isLocale, type Locale } from '@/lib/i18n';
import { LocaleProvider } from '@/components/LocaleProvider';

const RU_DESCRIPTION =
  'Интернет-магазин футбольной обуви и экипировки: бутсы, сороконожки, футзалки, детская обувь. Актуальное наличие, доставка Новой Почтой.';

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const ru = params.lang === 'ru';
  const description = ru ? RU_DESCRIPTION : SITE_DESCRIPTION;
  const title = ru
    ? 'Bootsbaza — футбольная обувь и экипировка'
    : 'Bootsbaza — футбольне взуття та екіпіровка';
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: '%s — Bootsbaza' },
    description,
    keywords: ru
      ? ['бутсы', 'сороконожки', 'футзалки', 'футбольная экипировка', 'Bootsbaza']
      : ['бутси', 'сороконіжки', 'футзалки', 'футбольна екіпіровка', 'Bootsbaza'],
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      locale: ru ? 'ru_RU' : 'uk_UA',
      alternateLocale: ru ? ['uk_UA'] : ['ru_RU'],
      images: ['/og.png'],
    },
    twitter: { card: 'summary_large_image', title: 'Bootsbaza', description, images: ['/og.png'] },
    verification: { google: '8jvtfF3c49laHUT7E3hunGPodjAonoEn4ZhQPq5pFFw' },
  };
}

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
            <ContactWidget />
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
