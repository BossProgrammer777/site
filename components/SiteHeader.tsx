import Link from 'next/link';
import { Logo } from './Logo';
import { CartButton } from './cart/CartButton';
import { PHONES } from '@/lib/contacts';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="Bootsbaza — на головну">
          <Logo />
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <a
            href={PHONES[0].href}
            className="hidden items-center gap-1.5 font-semibold [color:#c3d3c8] transition hover:text-brand lg:flex"
          >
            <svg className="h-4 w-4 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8.1 9.5a16 16 0 006 6l1.1-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z" />
            </svg>
            {PHONES[0].display}
          </a>
          <Link
            href="/catalog"
            className="font-semibold [color:#c3d3c8] transition hover:text-brand"
          >
            Каталог
          </Link>
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
