import Link from 'next/link';
import { Logo } from './Logo';
import { CartButton } from './cart/CartButton';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="Bootsbaza — на головну">
          <Logo />
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <Link
            href="/catalog"
            className="font-semibold text-ink-600 [color:#c3d3c8] transition hover:text-brand"
          >
            Каталог
          </Link>
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
