import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Socials } from '@/components/Socials';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { siteUrl } from '@/lib/site';
import { breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';

const YOUTUBE_CHANNEL = 'https://youtube.com/@bootsbaza9099';
const YOUTUBE_SEARCH = 'https://www.youtube.com/results?search_query=bootsbaza';

// Матчі команди для вбудованих плеєрів (решту — на YouTube).
const MATCH_VIDEOS = [
  { id: '0xQg4-UWUy8', title: 'Матч команди Bootsbaza' },
  { id: 'G2e1VeMGpAU', title: 'Матч команди Bootsbaza' },
  { id: 'mO7KhIGPzD8', title: 'Матч команди Bootsbaza' },
];

export const metadata: Metadata = {
  title: { absolute: 'Про нас — магазин футбольної екіпіровки з 2018 | Bootsbaza' },
  description:
    'Bootsbaza — інтернет-магазин футбольного взуття та екіпіровки з 2018 року. Маємо власну команду, що грає на турнірах Харкова. Ми самі граємо — тож знаємося на взутті.',
  alternates: { canonical: `${siteUrl()}/about` },
};

export default function AboutPage() {
  const base = siteUrl();
  const crumbs = breadcrumbJsonLd([
    { name: 'Головна', url: `${base}/` },
    { name: 'Про нас', url: `${base}/about` },
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm [color:#7d8f83]">
          <Link href="/" className="hover:text-brand">
            Головна
          </Link>
          <span>/</span>
          <span className="[color:#c3d3c8]">Про нас</span>
        </nav>

        {/* Герой */}
        <section className="grid items-center gap-8 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand">
              Про Bootsbaza
            </p>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              Ми в футболі <span className="text-brand">з 2018 року</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed [color:#9fb3a6] sm:text-base">
              Bootsbaza — це не просто магазин. Ми самі граємо у футбол: маємо власну аматорську
              команду, яка виступає на турнірах Харкова. Тому підбираємо взуття й екіпіровку так, як
              обирали б для себе — знаємо, як бутси поводяться на полі, які підошви для якого
              покриття й де важлива якість.
            </p>
          </div>
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink-800 bg-gradient-to-br from-ink-800 to-ink-900 bg-cover bg-center"
            style={{ backgroundImage: "url('/team.jpg')" }}
            role="img"
            aria-label="Футбольна команда Bootsbaza"
          />
        </section>

        {/* Наши принципы / доверие */}
        <section className="mt-14">
          <h2 className="mb-6 text-xl font-bold sm:text-2xl">Чому нам довіряють</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                t: 'Досвід із 2018 року',
                d: 'Понад 6 років у футбольній екіпіровці — тисячі підібраних пар взуття для гравців будь-якого рівня.',
              },
              {
                t: 'Своя команда',
                d: 'Ми граємо на турнірах Харкова й тестуємо екіпіровку в реальних матчах, а не лише на словах.',
              },
              {
                t: 'Актуальні наявність і ціни',
                d: 'Розміри, наявність і ціни на сайті оновлюються автоматично — ви бачите те, що справді є.',
              },
              {
                t: 'Розуміємося на взутті',
                d: 'Підкажемо розмір за розмірною сіткою й тип підошви під ваше покриття — бо самі граємо.',
              },
              {
                t: 'Чесні умови',
                d: 'Доставка «Новою Поштою» по всій Україні, оплата при отриманні, зрозуміла гарантія та повернення.',
              },
              {
                t: 'На зв’язку',
                d: 'Відповідаємо у месенджерах і соцмережах, допомагаємо з вибором до та після покупки.',
              },
            ].map((c) => (
              <div
                key={c.t}
                className="rounded-2xl border border-ink-800 bg-ink-900/50 p-5"
              >
                <h3 className="text-base font-bold [color:#e7efe9]">{c.t}</h3>
                <p className="mt-2 text-sm [color:#9fb3a6]">{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* YouTube — наши игры */}
        <section className="mt-14 overflow-hidden rounded-2xl border border-ink-800 bg-gradient-to-br from-ink-900 to-ink-950 p-6 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Дивіться наші ігри на YouTube</h2>
              <p className="mt-2 max-w-xl text-sm [color:#9fb3a6]">
                Наша команда регулярно грає на турнірах. Введіть у пошуку YouTube «<strong className="[color:#e7efe9]">Bootsbaza</strong>» — і побачите записи наших матчів. Це ми, це справжній футбол.
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
              Наш канал на YouTube
            </a>
            <a
              href={YOUTUBE_SEARCH}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-ink-700 px-5 py-2.5 text-sm font-semibold [color:#c3d3c8] transition hover:border-brand/50 hover:text-brand"
            >
              Знайти наші матчі
            </a>
          </div>
        </section>

        {/* Соцсети + CTA */}
        <section className="mt-14 flex flex-col items-start justify-between gap-6 rounded-2xl border border-ink-800 bg-ink-900/50 p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-xl font-bold">Готові обрати екіпіровку?</h2>
            <p className="mt-2 text-sm [color:#9fb3a6]">
              Перегляньте каталог або напишіть нам — підкажемо з вибором.
            </p>
            <Socials className="mt-4" />
          </div>
          <Link
            href="/catalog"
            className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-ink-950 transition hover:bg-brand-400"
          >
            Перейти до каталогу
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
