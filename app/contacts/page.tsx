import { InfoPage } from '@/components/InfoPage';
import { PHONES, INSTAGRAM } from '@/lib/contacts';

export const metadata = { title: 'Контакти — Bootsbaza' };

export default function ContactsPage() {
  return (
    <InfoPage title="Контакти">
      <p className="lead">
        Маєте питання щодо товару, розміру чи замовлення? Телефонуйте або пишіть — ми на зв’язку та
        радо допоможемо з вибором.
      </p>

      <h2>Телефони</h2>
      <ul>
        {PHONES.map((p) => (
          <li key={p.href}>
            <a href={p.href}>{p.display}</a>
          </li>
        ))}
      </ul>

      <h2>Instagram</h2>
      <p>
        Новинки, наявність і акції —{' '}
        <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
          @bootsbaza
        </a>
        .
      </p>

      <h2>Графік роботи</h2>
      <p>Приймаємо замовлення на сайті цілодобово. Обробка та консультації — щодня з 9:00 до 21:00.</p>

      <h2>Доставка</h2>
      <p>
        Відправляємо «Новою Поштою» по всій Україні. Детальніше — на сторінці{' '}
        <a href="/delivery">Доставка та оплата</a>.
      </p>
    </InfoPage>
  );
}
