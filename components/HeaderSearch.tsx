'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function HeaderSearch({
  className = '',
  onSubmitted,
}: {
  className?: string;
  onSubmitted?: () => void;
}) {
  const [q, setQ] = useState('');
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    router.push(t ? `/catalog?q=${encodeURIComponent(t)}` : '/catalog');
    onSubmitted?.();
  };

  return (
    <form onSubmit={submit} className={className} role="search">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 [color:#6b7d71]"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a1 1 0 01-1.42 1.42l-3.08-3.08A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Пошук товарів…"
          className="w-full rounded-xl border border-ink-700 bg-ink-900/80 py-2 pl-9 pr-3 text-sm [color:#e7efe9] outline-none placeholder:[color:#6b7d71] focus:border-brand/60 focus:ring-1 focus:ring-brand/40"
        />
      </div>
    </form>
  );
}
