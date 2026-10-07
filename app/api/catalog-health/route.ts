import { NextRequest, NextResponse } from 'next/server';
import { getCatalog } from '@/lib/cache';
import { catalogHealth, healthMessage, type HealthIssue } from '@/lib/catalogHealth';
import { sendTelegramText } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

// Ежедневная проверка прайса (Vercel Cron, см. vercel.json): если есть проблемы,
// которые влияют на сайт, — сообщение в Telegram-группу заказов. Всё в порядке —
// ничего не шлём. ?dry=1 — только вернуть список, без отправки.
// Доступ: Vercel Cron сам шлёт CRON_SECRET как Bearer-токен.
let lastSent = 0;
let lastTest = 0;

// Пример сообщения (?test=1) — показать, как выглядят оповещения. Текст фиксированный,
// реальные данные не используются; без авторизации, но не чаще раза в 10 минут.
const TEST_ISSUES: HealthIssue[] = [
  { key: 't1', level: 'critical', text: '🔴 <b>Сторінка /catalog/butsy/nike зникне</b> — у «Бутси» більше немає товарів Nike (було 37). Можливо, з назв прибрали бренд.' },
  { key: 't2', level: 'warn', text: '🟠 <b>«Бутси»: 12 з 60 товарів без бренду</b>\nСайт не впізнав бренд за назвою — ці товари не потрапляють у фільтр «Бренд» і на сторінки Nike/Adidas:\n• Бутси Swift 3 FG\n• Бутси Zeta 2\n• Бутси Hyper Strike\n… і ще 9' },
  { key: 't3', level: 'warn', text: '🟠 <b>Змінено назву 2 товар(ів)</b> → змінилась адреса сторінки (старі адреси ведуть на нові через редирект). Якщо назви змінили не ви — перевірте прайс:\n• 1030: «Getry Nike» → «Гетри» (Екіпірування)\n• 418: «Nike Air Zoom Mercurial Vapor XVI FG» → «Бутси Air Zoom Mercurial Vapor XVI FG» (Бутси)' },
];

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('test') === '1') {
    if (Date.now() - lastTest < 10 * 60 * 1000) return NextResponse.json({ ok: false, error: 'зачекайте 10 хвилин' }, { status: 429 });
    lastTest = Date.now();
    const { sent } = await sendTelegramText(healthMessage('🧪 ТЕСТ — так виглядатимуть сповіщення про прайс', TEST_ISSUES));
    return NextResponse.json({ ok: true, test: true, sent });
  }

  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const catalog = await getCatalog();
  const issues = catalogHealth(catalog);
  const dry = req.nextUrl.searchParams.get('dry') === '1';

  // Защита от повторных вызовов: не чаще раза в 30 минут.
  let sent = false;
  if (!dry && issues.length && Date.now() - lastSent > 30 * 60 * 1000) {
    lastSent = Date.now();
    sent = (await sendTelegramText(healthMessage('🔎 Щоденна перевірка прайсу', issues))).sent;
  }
  return NextResponse.json({ ok: true, source: catalog.source, issues: issues.map((i) => ({ key: i.key, level: i.level })), sent });
}
