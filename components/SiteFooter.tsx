'use client';

import { Logo } from './Logo';
import { Socials } from './Socials';
import { LocaleLink } from './LocaleLink';
import { useT } from './LocaleProvider';
import { PHONES } from '@/lib/contacts';

export function SiteFooter() {
  const t = useT();
  const infoLinks = [
    { href: '/about', label: t.nav.about },
    { href: '/delivery', label: t.nav.delivery },
    { href: '/warranty', label: t.nav.warranty },
    { href: '/offer', label: t.nav.offer },
    { href: '/contacts', label: t.nav.contacts },
  ];
  return (
    <footer className="mt-16 border-t border-ink-800 bg-ink-950/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm [color:#7d8f83]">{t.footer.tagline}</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide [color:#c3d3c8]">{t.footer.shop}</h3>
          <ul className="space-y-2 text-sm [color:#9fb3a6]">
            <li>
              <LocaleLink href="/catalog" className="transition hover:text-brand">
                {t.nav.catalog}
              </LocaleLink>
            </li>
            <li>
              <LocaleLink href="/blog" className="transition hover:text-brand">
                {t.footer.blog}
              </LocaleLink>
            </li>
            <li>
              <LocaleLink href="/cart" className="transition hover:text-brand">
                {t.footer.cart}
              </LocaleLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide [color:#c3d3c8]">
            {t.footer.info}
          </h3>
          <ul className="space-y-2 text-sm [color:#9fb3a6]">
            {infoLinks.map((l) => (
              <li key={l.href}>
                <LocaleLink href={l.href} className="transition hover:text-brand">
                  {l.label}
                </LocaleLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide [color:#c3d3c8]">{t.footer.contacts}</h3>
          <ul className="space-y-2 text-sm [color:#9fb3a6]">
            {PHONES.map((p) => (
              <li key={p.href}>
                <a href={p.href} className="font-semibold transition hover:text-brand">
                  {p.display}
                </a>
              </li>
            ))}
          </ul>
          <Socials className="mt-4" />
        </div>
      </div>

      <div className="border-t border-ink-800 py-5 text-center text-xs [color:#6b7d71]">
        © {new Date().getFullYear()} Bootsbaza. {t.footer.rights}
      </div>
    </footer>
  );
}
