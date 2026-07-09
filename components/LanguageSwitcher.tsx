'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from './LocaleProvider';

// Переключатель UA/RU: сохраняет текущий путь, меняет только префикс локали.
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname() || '/';
  // «Чистый» путь без префикса ru.
  const clean = pathname === '/ru' ? '/' : pathname.startsWith('/ru/') ? pathname.slice(3) : pathname;
  const ukHref = clean || '/';
  const ruHref = '/ru' + (clean === '/' ? '' : clean);

  const base = 'px-1.5 py-0.5 text-xs font-bold transition';
  const on = 'text-brand';
  const off = '[color:#7d8f83] hover:text-brand';

  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label="Мова / Язык">
      <Link href={ukHref} className={`${base} ${locale === 'uk' ? on : off}`} aria-current={locale === 'uk'}>
        UA
      </Link>
      <span className="[color:#3a463e]">/</span>
      <Link href={ruHref} className={`${base} ${locale === 'ru' ? on : off}`} aria-current={locale === 'ru'}>
        RU
      </Link>
    </div>
  );
}
