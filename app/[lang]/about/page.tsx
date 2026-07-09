import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Socials } from '@/components/Socials';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { siteUrl } from '@/lib/site';
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';
import { altMeta, localeHref, Locale } from '@/lib/i18n';
import { dict } from '@/lib/dictionaries';

const YOUTUBE_CHANNEL = 'https://youtube.com/@bootsbaza9099';
const YOUTUBE_SEARCH = 'https://www.youtube.com/results?search_query=bootsbaza';

// Матчі команди для вбудованих плеєрів (решту — на YouTube).
const MATCH_VIDEOS = [
  { id: '0xQg4-UWUy8', title: 'Матч команди Bootsbaza' },
  { id: 'G2e1VeMGpAU', title: 'Матч команди Bootsbaza' },
  { id: 'mO7KhIGPzD8', title: 'Матч команди Bootsbaza' },
];

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  return {
    title: { absolute: 'Про нас — магазин футбольної екіпіровки з 2018 | Bootsbaza' },
    description:
      'Bootsbaza — інтернет-магазин футбольного взуття та екіпіровки з 2018 року. Маємо власну команду, що грає на турнірах Харкова. Ми самі граємо — тож знаємося на взутті.',
    alternates: altMeta(params.lang, '/about'),
  };
}

const A = {
  uk: {
    about: 'Про Bootsbaza',
    heroA: 'Ми в футболі', heroB: 'з 2018 року',
    heroP: 'Bootsbaza — це не просто магазин. Ми самі граємо у футбол: маємо власну аматорську команду, яка виступає на турнірах Харкова. Тому підбираємо взуття й екіпіровку так, як обирали б для себе — знаємо, як бутси поводяться на полі, які підошви для якого покриття й де важлива якість.',
    teamAlt: 'Футбольна команда Bootsbaza',
    trust: 'Чому нам довіряють',
    cards: [
      { t: 'Досвід із 2018 року', d: 'Понад 6 років у футбольній екіпіровці — тисячі підібраних пар взуття для гравців будь-якого рівня.' },
      { t: 'Своя команда', d: 'Ми граємо на турнірах Харкова й тестуємо екіпіровку в реальних матчах, а не лише на словах.' },
      { t: 'Актуальні наявність і ціни', d: 'Розміри, наявність і ціни на сайті оновлюються автоматично — ви бачите те, що справді є.' },
      { t: 'Розуміємося на взутті', d: 'Підкажемо розмір за розмірною сіткою й тип підошви під ваше покриття — бо самі граємо.' },
      { t: 'Чесні умови', d: 'Доставка «Новою Поштою» по всій Україні, оплата при отриманні, зрозуміла гарантія та повернення.' },
      { t: 'На зв’язку', d: 'Відповідаємо у месенджерах і соцмережах, допомагаємо з вибором до та після покупки.' },
    ],
    ytTitle: 'Дивіться наші ігри на YouTube',
    ytA: 'Наша команда регулярно грає на турнірах. Введіть у пошуку YouTube «',
    ytB: '» — і побачите записи наших матчів. Це ми, це справжній футбол.',
    ytChannel: 'Наш канал на YouTube', ytSearch: 'Знайти наші матчі',
    ctaTitle: 'Готові обрати екіпіровку?', ctaText: 'Перегляньте каталог або напишіть нам — підкажемо з вибором.', ctaBtn: 'Перейти до каталогу',
  },
  ru: {
    about: 'О Bootsbaza',
    heroA: 'Мы в футболе', heroB: 'с 2018 года',
    heroP: 'Bootsbaza — это не просто магазин. Мы сами играем в футбол: у нас есть своя любительская команда, которая выступает на турнирах Харькова. Поэтому подбираем обувь и экипировку так, как выбирали бы для себя — знаем, как бутсы ведут себя на поле, какие подошвы для какого покрытия и где важно качество.',
    teamAlt: 'Футбольная команда Bootsbaza',
    trust: 'Почему нам доверяют',
    cards: [
      { t: 'Опыт с 2018 года', d: 'Более 6 лет в футбольной экипировке — тысячи подобранных пар обуви для игроков любого уровня.' },
      { t: 'Своя команда', d: 'Мы играем на турнирах Харькова и тестируем экипировку в реальных матчах, а не только на словах.' },
      { t: 'Актуальные наличие и цены', d: 'Размеры, наличие и цены на сайте обновляются автоматически — вы видите то, что действительно есть.' },
      { t: 'Разбираемся в обуви', d: 'Подскажем размер по размерной сетке и тип подошвы под ваше покрытие — потому что сами играем.' },
      { t: 'Честные условия', d: 'Доставка «Новой Почтой» по всей Украине, оплата при получении, понятная гарантия и возврат.' },
      { t: 'На связи', d: 'Отвечаем в мессенджерах и соцсетях, помогаем с выбором до и после покупки.' },
    ],
    ytTitle: 'Смотрите наши игры на YouTube',
    ytA: 'Наша команда регулярно играет на турнирах. Введите в поиске YouTube «',
    ytB: '» — и увидите записи наших матчей. Это мы, это настоящий футбол.',
    ytChannel: 'Наш канал на YouTube', ytSearch: 'Найти наши матчи',
    ctaTitle: 'Готовы выбрать экипировку?', ctaText: 'Посмотрите каталог или напишите нам — подскажем с выбором.', ctaBtn: 'Перейти в каталог',
  },
};

export default function AboutPage({ params }: { params: { lang: Locale } }) {
  const c = A[params.lang];
  const base = siteUrl();
  const bc = dict[params.lang].breadcrumb;
  const lh = (p: string) => localeHref(params.lang, p);
  const aboutLabel = dict[params.lang].nav.about;
  const crumbs = breadcrumbJsonLd([
    { name: bc.home, url: `${base}${lh('/')}` },
    { name: aboutLabel, url: `${base}${lh('/about')}` },
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm [color:#7d8f83]">
          <Link href={lh('/')} className="hover:text-brand">
            {bc.home}
          </Link>
          <span>/</span>
          <span className="[color:#c3d3c8]">{aboutLabel}</span>
        </nav>

        {/* Герой */}
        <section className="grid items-center gap-8 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand">
              {c.about}
            </p>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              {c.heroA} <span className="text-brand">{c.heroB}</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed [color:#9fb3a6] sm:text-base">{c.heroP}</p>
          </div>
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink-800 bg-gradient-to-br from-ink-800 to-ink-900 bg-cover bg-center"
            style={{ backgroundImage: "url('/team.jpg')" }}
            role="img"
            aria-label={c.teamAlt}
          />
        </section>

        {/* Наши принципы / доверие */}
        <section className="mt-14">
          <h2 className="mb-6 text-xl font-bold sm:text-2xl">{c.trust}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {c.cards.map((card) => (
              <div key={card.t} className="rounded-2xl border border-ink-800 bg-ink-900/50 p-5">
                <h3 className="text-base font-bold [color:#e7efe9]">{card.t}</h3>
                <p className="mt-2 text-sm [color:#9fb3a6]">{card.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* YouTube — наши игры */}
        <section className="mt-14 overflow-hidden rounded-2xl border border-ink-800 bg-gradient-to-br from-ink-900 to-ink-950 p-6 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">{c.ytTitle}</h2>
              <p className="mt-2 max-w-xl text-sm [color:#9fb3a6]">
                {c.ytA}
                <strong className="[color:#e7efe9]">Bootsbaza</strong>
                {c.ytB}
              </p>
            </div>
            <svg className="h-12 w-12 shrink-0 text-brand" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M23 12s0-3-.4-4.4a2.5 2.5 0 00-1.8-1.8C19.4 5.4 12 5.4 12 5.4s-7.4 0-8.8.4A2.5 2.5 0 001.4 7.6C1 9 1 12 1 12s0 3 .4 4.4a2.5 2.5 0 001.8 1.8c1.4.4 8.8.4 8.8.4s7.4 0 8.8-.4a2.5 2.5 0 001.8-1.8C23 15 23 12 23 12zM9.8 15.2V8.8l5.4 3.2-5.4 3.2z" />
            </svg>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {MATCH_VIDEOS.map((v) => (
              <YouTubeEmbed key={v.id} id={v.id} title={v.title} />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={YOUTUBE_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
            >
              {c.ytChannel}
            </a>
            <a
              href={YOUTUBE_SEARCH}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-ink-700 px-5 py-2.5 text-sm font-semibold [color:#c3d3c8] transition hover:border-brand/50 hover:text-brand"
            >
              {c.ytSearch}
            </a>
          </div>
        </section>

        {/* Соцсети + CTA */}
        <section className="mt-14 flex flex-col items-start justify-between gap-6 rounded-2xl border border-ink-800 bg-ink-900/50 p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-xl font-bold">{c.ctaTitle}</h2>
            <p className="mt-2 text-sm [color:#9fb3a6]">{c.ctaText}</p>
            <Socials className="mt-4" />
          </div>
          <Link
            href={lh('/catalog')}
            className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
          >
            {c.ctaBtn}
          </Link>
        </section>
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
    </>
  );
}
