import { SOCIALS, SocialId } from '@/lib/contacts';

function Icon({ id }: { id: SocialId }) {
  switch (id) {
    case 'instagram':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 3c.3 2 1.5 3.6 3.5 4v2.6c-1.3 0-2.6-.4-3.6-1.1v5.6a5.6 5.6 0 11-5.6-5.6c.3 0 .6 0 .9.1v2.7a2.9 2.9 0 00-.9-.1 2.9 2.9 0 102.9 2.9V3h2.8z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23 12s0-3-.4-4.4a2.5 2.5 0 00-1.8-1.8C19.4 5.4 12 5.4 12 5.4s-7.4 0-8.8.4A2.5 2.5 0 001.4 7.6C1 9 1 12 1 12s0 3 .4 4.4a2.5 2.5 0 001.8 1.8c1.4.4 8.8.4 8.8.4s7.4 0 8.8-.4a2.5 2.5 0 001.8-1.8C23 15 23 12 23 12zM9.8 15.2V8.8l5.4 3.2-5.4 3.2z" />
        </svg>
      );
    case 'telegram':
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.9 4.3l-3.3 15.6c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13.5l-4.9-1.5c-1-.3-1.1-1 .2-1.5l19.2-7.4c.9-.3 1.6.2 1.2 1.7z" />
        </svg>
      );
  }
}

/** Ряд иконок соцсетей. */
export function Socials({ className = '', linkClassName = '' }: { className?: string; linkClassName?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {SOCIALS.map((s) => (
        <a
          key={s.id}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.name}
          title={s.name}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-700 bg-ink-900 [color:#c3d3c8] transition hover:border-brand/50 hover:text-brand ${linkClassName}`}
        >
          <Icon id={s.id} />
        </a>
      ))}
    </div>
  );
}
