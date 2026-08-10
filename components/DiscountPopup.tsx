'use client';

import { useEffect, useState } from 'react';
import { useLocale } from './LocaleProvider';
import { INSTAGRAM } from '@/lib/contacts';

// Промо-віджет «знижка -5% на перше замовлення».
// Крок 1 — пропозиція, крок 2 — підписка на Instagram, крок 3 — показ промокоду.
// Важливо: реально перевірити підписку сторонній сайт НЕ може (Instagram закрив API),
// тож крок 2 працює «на довірі» — людина підписується і сама тисне «Я підписався».
// Стан зберігається в localStorage, щоб вікно не вискакувало повторно.

const PROMO = 'sale5';
const KEY = 'bb_promo_state'; // 'seen' | 'unlocked'
const AUTO_DELAY = 5000; // 5 сек після заходу

type Step = 'offer' | 'subscribe' | 'code';

export function DiscountPopup() {
  const locale = useLocale();
  const ru = locale === 'ru';

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('offer');
  const [copied, setCopied] = useState(false);
  const [clickedIg, setClickedIg] = useState(false);

  // При завантаженні: якщо код уже відкрито — одразу ведемо на крок з кодом.
  // Якщо ще не бачив вікна — показуємо автоматично через 5 сек.
  useEffect(() => {
    let state: string | null = null;
    try {
      state = localStorage.getItem(KEY);
    } catch {
      /* приватний режим — ігноруємо */
    }
    if (state === 'unlocked') {
      setStep('code');
      return;
    }
    if (state === 'seen') return;
    const t = setTimeout(() => {
      setOpen(true);
      try {
        localStorage.setItem(KEY, 'seen');
      } catch {
        /* ignore */
      }
    }, AUTO_DELAY);
    return () => clearTimeout(t);
  }, []);

  const openInstagram = () => {
    setClickedIg(true);
    window.open(INSTAGRAM, '_blank', 'noopener,noreferrer');
  };

  const unlock = () => {
    setStep('code');
    try {
      localStorage.setItem(KEY, 'unlocked');
    } catch {
      /* ignore */
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const T = ru
    ? {
        tab: 'Скидка -5%',
        aria: 'Получить скидку',
        offerTitle: '🎁 -5% на первый заказ',
        offerText: 'Дарим скидку на любую пару! Забери промокод за пару секунд 👇',
        offerBtn: 'Забрать скидку',
        subTitle: 'Остался один шаг 👇',
        subText: 'Подпишись на наш Instagram — там новинки, розыгрыши и живые отзывы. После подписки жми кнопку ниже.',
        subBtn: 'Подписаться в Instagram',
        subDone: '✅ Я подписался — показать промокод',
        subHint: 'Сначала открой Instagram и подпишись 👆',
        codeTitle: '🔥 Твой промокод готов!',
        codeText: 'Скидка -5% на заказ. Назови этот промокод при оформлении:',
        codeCopy: 'Скопировать',
        codeCopied: '✓ Скопировано',
        codeThanks: 'Спасибо, что ты с нами! 💚',
        close: 'Закрыть',
      }
    : {
        tab: 'Знижка -5%',
        aria: 'Отримати знижку',
        offerTitle: '🎁 -5% на перше замовлення',
        offerText: 'Даруємо знижку на будь-яку пару! Забери промокод за пару секунд 👇',
        offerBtn: 'Забрати знижку',
        subTitle: 'Залишився один крок 👇',
        subText: 'Підпишись на наш Instagram — там новинки, розіграші та живі відгуки. Після підписки тисни кнопку нижче.',
        subBtn: 'Підписатися в Instagram',
        subDone: '✅ Я підписався — показати промокод',
        subHint: 'Спершу відкрий Instagram і підпишись 👆',
        codeTitle: '🔥 Твій промокод готовий!',
        codeText: 'Знижка -5% на замовлення. Назви цей промокод при оформленні:',
        codeCopy: 'Скопіювати',
        codeCopied: '✓ Скопійовано',
        codeThanks: 'Дякуємо, що ти з нами! 💚',
        close: 'Закрити',
      };

  const btn =
    'w-full rounded-xl bg-brand px-4 py-3 text-center text-sm font-bold text-ink-950 transition hover:bg-brand-400';

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-3">
      {open && (
        <div className="relative w-72 rounded-2xl border border-brand/40 bg-ink-950/95 p-4 shadow-2xl backdrop-blur">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={T.close}
            className="absolute right-3 top-3 [color:#9fb3a6] transition hover:text-brand"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {step === 'offer' && (
            <>
              <p className="pr-5 text-base font-extrabold [color:#e7efe9]">{T.offerTitle}</p>
              <p className="mb-3 mt-1 text-xs [color:#9fb3a6]">{T.offerText}</p>
              <button type="button" onClick={() => setStep('subscribe')} className={btn}>
                {T.offerBtn}
              </button>
            </>
          )}

          {step === 'subscribe' && (
            <>
              <p className="pr-5 text-base font-extrabold [color:#e7efe9]">{T.subTitle}</p>
              <p className="mb-3 mt-1 text-xs [color:#9fb3a6]">{T.subText}</p>
              <button
                type="button"
                onClick={openInstagram}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-brand/50 bg-ink-900 px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-ink-800"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
                {T.subBtn}
              </button>
              {clickedIg ? (
                <button type="button" onClick={unlock} className={btn}>
                  {T.subDone}
                </button>
              ) : (
                <p className="text-center text-[11px] [color:#6b7d71]">{T.subHint}</p>
              )}
            </>
          )}

          {step === 'code' && (
            <>
              <p className="pr-5 text-base font-extrabold [color:#e7efe9]">{T.codeTitle}</p>
              <p className="mb-3 mt-1 text-xs [color:#9fb3a6]">{T.codeText}</p>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex-1 rounded-xl border border-dashed border-brand/60 bg-ink-900 px-3 py-2.5 text-center text-lg font-black tracking-widest text-brand">
                  {PROMO}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="rounded-xl bg-brand px-3 py-2.5 text-xs font-bold text-ink-950 transition hover:bg-brand-400"
                >
                  {copied ? T.codeCopied : T.codeCopy}
                </button>
              </div>
              <p className="text-center text-xs [color:#9fb3a6]">{T.codeThanks}</p>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={T.aria}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-ink-950 shadow-glow transition hover:bg-brand-400"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
          <path d="M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
        </svg>
        {T.tab}
      </button>
    </div>
  );
}
