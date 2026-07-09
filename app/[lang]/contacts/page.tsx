import type { Metadata } from 'next';
import { InfoPage } from '@/components/InfoPage';
import { Socials } from '@/components/Socials';
import { PHONES, SOCIALS } from '@/lib/contacts';
import { altMeta, localeHref, Locale } from '@/lib/i18n';

export function generateMetadata({ params }: { params: { lang: Locale } }): Metadata {
  const title = params.lang === 'ru' ? 'Контакты — Bootsbaza' : 'Контакти — Bootsbaza';
  return { title, alternates: altMeta(params.lang, '/contacts') };
}

const C = {
  uk: {
    title: 'Контакти',
    lead: 'Маєте питання щодо товару, розміру чи замовлення? Телефонуйте або пишіть — ми на зв’язку та радо допоможемо з вибором.',
    phones: 'Телефони',
    social: 'Ми в соцмережах',
    socialLead: 'Новинки, наявність, огляди й акції — підписуйтесь:',
    hours: 'Графік роботи',
    hoursText: 'Приймаємо замовлення на сайті цілодобово. Обробка та консультації — щодня з 9:00 до 21:00.',
    delivery: 'Доставка',
    deliveryText: 'Відправляємо «Новою Поштою» по всій Україні. Детальніше — на сторінці ',
    deliveryLink: 'Доставка та оплата',
  },
  ru: {
    title: 'Контакты',
    lead: 'Есть вопросы по товару, размеру или заказу? Звоните или пишите — мы на связи и с радостью поможем с выбором.',
    phones: 'Телефоны',
    social: 'Мы в соцсетях',
    socialLead: 'Новинки, наличие, обзоры и акции — подписывайтесь:',
    hours: 'График работы',
    hoursText: 'Принимаем заказы на сайте круглосуточно. Обработка и консультации — ежедневно с 9:00 до 21:00.',
    delivery: 'Доставка',
    deliveryText: 'Отправляем «Новой Почтой» по всей Украине. Подробнее — на странице ',
    deliveryLink: 'Доставка и оплата',
  },
};

export default function ContactsPage({ params }: { params: { lang: Locale } }) {
  const t = C[params.lang];
  return (
    <InfoPage title={t.title}>
      <p className="lead">{t.lead}</p>

      <h2>{t.phones}</h2>
      <ul>
        {PHONES.map((p) => (
          <li key={p.href}>
            <a href={p.href}>{p.display}</a>
          </li>
        ))}
      </ul>

      <h2>{t.social}</h2>
      <p>{t.socialLead}</p>
      <ul>
        {SOCIALS.map((s) => (
          <li key={s.id}>
            {s.name}:{' '}
            <a href={s.href} target="_blank" rel="noopener noreferrer">
              {s.handle}
            </a>
          </li>
        ))}
      </ul>
      <Socials className="mt-1" />

      <h2>{t.hours}</h2>
      <p>{t.hoursText}</p>

      <h2>{t.delivery}</h2>
      <p>
        {t.deliveryText}
        <a href={localeHref(params.lang, '/delivery')}>{t.deliveryLink}</a>.
      </p>
    </InfoPage>
  );
}
