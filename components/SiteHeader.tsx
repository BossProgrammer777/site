'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import { CartButton } from './cart/CartButton';
import { FavoritesLink } from './favorites/FavoritesLink';
import { MobileMenu } from './MobileMenu';
import { HeaderSearch } from './HeaderSearch';
import { LocaleLink } from './LocaleLink';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLocale, useT } from './LocaleProvider';
import { localeHref } from '@/lib/i18n';
import { PHONES } from '@/lib/contacts';

export function SiteHeader() {
  const t = useT();
  const locale = useLocale();
  const links = [
    { href: '/catalog', label: t.nav.catalog },
    { href: '/blog', label: t.nav.blog },
    { href: '/about', label: t.nav.about },
    { href: '/delivery', label: t.nav.delivery },
    { href: '/warranty', label: t.nav.warranty },
    { href: '/contacts', label: t.nav.contacts },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/85 backdrop-blur">
      {/* Верхний ряд: лого + поиск + иконки */}
      <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4">
        <Link href={localeHref(locale, '/')} aria-label="Bootsbaza — на головну" className="shrink-0">
          <Logo />
        </Link>

        <HeaderSearch className="hidden flex-1 sm:block" />

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <FavoritesLink />
          <CartButton />
          <MobileMenu />
        </div>
      </div>

      {/* Нижний ряд: разделы + телефон (desktop) */}
      <div className="hidden border-t border-ink-800/70 lg:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <nav className="flex items-center gap-6 text-sm">
            {links.map((l) => (
              <LocaleLink
                key={l.href}
                href={l.href}
                className="font-medium [color:#c3d3c8] transition hover:text-brand"
              >
                {l.label}
              </LocaleLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a
              href={PHONES[0].href}
              className="flex items-center gap-1.5 text-sm font-semibold [color:#c3d3c8] transition hover:text-brand"
            >
              <svg className="h-4 w-4 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8.1 9.5a16 16 0 006 6l1.1-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z" />
              </svg>
              {PHONES[0].display}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
