import Link from 'next/link';
import { Logo } from './Logo';
import { Socials } from './Socials';
import { PHONES, INFO_LINKS } from '@/lib/contacts';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ink-800 bg-ink-950/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm [color:#7d8f83]">
            Інтернет-магазин футбольного взуття та екіпіровки. Актуальна наявність і чесні ціни.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide [color:#c3d3c8]">Магазин</h3>
          <ul className="space-y-2 text-sm [color:#9fb3a6]">
            <li>
              <Link href="/catalog" className="transition hover:text-brand">
                Каталог
              </Link>
            </li>
            <li>
              <Link href="/blog" className="transition hover:text-brand">
                Блог
              </Link>
            </li>
            <li>
              <Link href="/cart" className="transition hover:text-brand">
                Кошик
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide [color:#c3d3c8]">
            Інформація
          </h3>
          <ul className="space-y-2 text-sm [color:#9fb3a6]">
            {INFO_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide [color:#c3d3c8]">Контакти</h3>
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
        © {new Date().getFullYear()} Bootsbaza — інтернет-магазин футбольної екіпіровки. Усі права захищені.
      </div>
    </footer>
  );
}
