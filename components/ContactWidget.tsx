'use client';

import { useState } from 'react';
import { useLocale } from './LocaleProvider';
import { SOCIALS, PHONES } from '@/lib/contacts';

// Плавающая кнопка-консультант: «Залишились питання?» → выбор мессенджера
// (Telegram / Viber / Instagram Direct). Ведёт туда, где продавец и так на связи.
export function ContactWidget() {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const ru = locale === 'ru';

  const tg = SOCIALS.find((s) => s.id === 'telegram')?.href || 'https://t.me/your_seller_ua';
  const ig = SOCIALS.find((s) => s.id === 'instagram')?.href || '';
  const phoneDigits = (PHONES[0]?.href || '').replace(/\D/g, '');
  const viber = `viber://chat?number=%2B${phoneDigits}`;

  const t = ru
    ? { title: 'Остались вопросы?', sub: 'Напишите нам — всё решим 👇', aria: 'Связаться с нами', ig: 'Instagram Direct' }
    : { title: 'Залишились питання?', sub: 'Напишіть нам — і все вирішимо 👇', aria: "Зв'язатися з нами", ig: 'Instagram Direct' };

  const item =
    'flex items-center gap-3 rounded-xl border border-ink-700 bg-ink-900 px-4 py-2.5 text-sm font-semibold [color:#e7efe9] transition hover:border-brand/50 hover:text-brand';

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-64 rounded-2xl border border-ink-700 bg-ink-950/95 p-4 shadow-2xl backdrop-blur">
          <p className="text-sm font-bold [color:#e7efe9]">{t.title}</p>
          <p className="mt-0.5 mb-3 text-xs [color:#9fb3a6]">{t.sub}</p>
          <div className="space-y-2">
            <a href={tg} target="_blank" rel="noopener noreferrer" className={item}>
              <svg className="h-5 w-5 shrink-0 text-brand" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.9 4.3l-3.3 15.6c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13.5l-4.9-1.5c-1-.3-1.1-1 .2-1.5l19.2-7.4c.9-.3 1.6.2 1.2 1.7z" />
              </svg>
              Telegram
            </a>
            <a href={viber} className={item}>
              <svg className="h-5 w-5 shrink-0 text-brand" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.9 2 3 5.4 3 10c0 2.3 1 4.3 2.7 5.7-.1 1.3-.6 2.7-1.5 3.8 1.6-.2 3-.8 4.1-1.7 1.1.3 2.4.5 3.7.5 5.1 0 9-3.4 9-8s-3.9-8-9-8zm4.7 10.8c-.4.7-1.6 1.3-2.3 1.1-.6-.2-1.4-.4-3-1.4-1.9-1.2-3-2.9-3.1-3-.1-.1-.7-1-.7-1.9s.4-1.3.6-1.5c.2-.2.4-.2.5-.2h.4c.1 0 .3 0 .5.4l.6 1.5c.1.1.1.3 0 .4l-.3.4c-.1.1-.2.3-.1.5.1.1.5.9 1.2 1.4.8.7 1.5 1 1.7 1.1.2.1.3.1.4-.1l.5-.6c.1-.2.3-.1.5-.1l1.4.7c.2.1.4.2.4.3.1.1.1.6-.2 1.2z" />
              </svg>
              Viber
            </a>
            {ig && (
              <a href={ig} target="_blank" rel="noopener noreferrer" className={item}>
                <svg className="h-5 w-5 shrink-0 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
                {t.ig}
              </a>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.aria}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-ink-950 shadow-glow transition hover:bg-brand-400"
      >
        {open ? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.4 8.4 0 01-9 8.4 9 9 0 01-3.9-.9L3 20l1.1-4A8.4 8.4 0 1121 11.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
