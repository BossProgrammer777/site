'use client';

import { useState } from 'react';
import { PHONES } from '@/lib/contacts';
import { HeaderSearch } from './HeaderSearch';
import { LocaleLink } from './LocaleLink';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useT } from './LocaleProvider';

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const t = useT();

  const links = [
    { href: '/catalog', label: t.nav.catalog, primary: true },
    { href: '/delivery', label: t.nav.delivery },
    { href: '/warranty', label: t.nav.warranty },
    { href: '/about', label: t.nav.about },
    { href: '/blog', label: t.nav.blog },
    { href: '/contacts', label: t.nav.contacts },
  ];

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Меню"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-700 bg-ink-900 [color:#c3d3c8]"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 border-b border-ink-800 bg-ink-950 shadow-2xl">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            <HeaderSearch className="py-3" onSubmitted={close} />
            {links.map((l) => (
              <LocaleLink
                key={l.href}
                href={l.href}
                onClick={close}
                className={
                  'border-b border-ink-800 py-3 text-sm ' +
                  (l.primary ? 'font-semibold [color:#e7efe9]' : '[color:#c3d3c8]')
                }
              >
                {l.label}
              </LocaleLink>
            ))}
            <div className="flex items-center justify-between py-3">
              <div className="flex flex-col gap-1">
                {PHONES.map((p) => (
                  <a key={p.href} href={p.href} className="text-sm font-semibold text-brand">
                    {p.display}
                  </a>
                ))}
              </div>
              <LanguageSwitcher className="rounded-lg border border-ink-700 px-1" />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
