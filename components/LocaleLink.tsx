'use client';

import Link from 'next/link';
import { useLocale } from './LocaleProvider';
import { localeHref } from '@/lib/i18n';

// Ссылка, автоматически добавляющая префикс локали к внутренним путям.
export function LocaleLink({
  href,
  ...rest
}: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string }) {
  const locale = useLocale();
  return <Link href={localeHref(locale, href)} {...rest} />;
}
