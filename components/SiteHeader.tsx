import Link from 'next/link';
import { Logo } from './Logo';
import { CartButton } from './cart/CartButton';
import { FavoritesLink } from './favorites/FavoritesLink';
import { MobileMenu } from './MobileMenu';
import { PHONES, INFO_LINKS } from '@/lib/contacts';

// В шапке (desktop) показываем Каталог + инфо-ссылки, кроме «Договір оферти».
const HEADER_LINKS = [
  { href: '/catalog', label: 'Каталог' },
  ...INFO_LINKS.filter((l) => l.href !== '/offer'),
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/85 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="Bootsbaza — на головну">
          <Logo />
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <nav className="hidden items-center gap-5 text-sm lg:flex">
            {HEADER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-medium [color:#c3d3c8] transition hover:text-brand"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <a
            href={PHONES[0].href}
            className="hidden items-center gap-1.5 text-sm font-semibold [color:#c3d3c8] transition hover:text-brand xl:flex"
          >
            <svg className="h-4 w-4 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8.1 9.5a16 16 0 006 6l1.1-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z" />
            </svg>
            {PHONES[0].display}
          </a>

          <FavoritesLink />
          <CartButton />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
