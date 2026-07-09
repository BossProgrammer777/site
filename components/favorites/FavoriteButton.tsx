'use client';

import { useFavorites } from './FavoritesContext';
import { useLocale } from '../LocaleProvider';

export function FavoriteButton({ id, className = '' }: { id: string; className?: string }) {
  const { has, toggle } = useFavorites();
  const locale = useLocale();
  const active = has(id);
  const label = active
    ? locale === 'ru'
      ? 'Убрать из избранного'
      : 'Прибрати з обраного'
    : locale === 'ru'
      ? 'Добавить в избранное'
      : 'Додати в обране';

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className={
        'flex items-center justify-center rounded-full transition ' +
        (active ? 'text-brand' : 'text-white/80 hover:text-brand') +
        ' ' +
        className
      }
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
      </svg>
    </button>
  );
}
