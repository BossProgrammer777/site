import { NextRequest, NextResponse } from 'next/server';
import { getCatalog } from '@/lib/cache';
import { catalogHealth } from '@/lib/catalogHealth';
import { sendHealthReport } from '@/lib/catalogAlerts';

export const dynamic = 'force-dynamic';

// Ежедневная проверка прайса (Vercel Cron, см. vercel.json): если есть проблемы,
// которые влияют на сайт, — сообщение в Telegram-группу заказов. Всё в порядке —
// ничего не шлём. ?dry=1 — только вернуть список, без отправки.
// Доступ: Vercel Cron сам шлёт CRON_SECRET как Bearer-токен.
let lastSent = 0;
let lastReport = 0;

export async function GET(req: NextRequest) {
  // ?report=1 — прислать текущий отчёт с полным списком в группу вручную
  // (без авторизации: в ответе ничего не раскрываем; не чаще раза в 10 минут).
  if (req.nextUrl.searchParams.get('report') === '1') {
    if (Date.now() - lastReport < 10 * 60 * 1000) return NextResponse.json({ ok: false, error: 'зачекайте 10 хвилин' }, { status: 429 });
    lastReport = Date.now();
    const issues = catalogHealth(await getCatalog());
    const sent = issues.length ? await sendHealthReport('🔎 Перевірка прайсу (за запитом)', issues) : false;
    return NextResponse.json({ ok: true, issues: issues.length, sent });
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
    sent = await sendHealthReport('🔎 Щоденна перевірка прайсу', issues);
  }
  return NextResponse.json({ ok: true, source: catalog.source, issues: issues.map((i) => ({ key: i.key, level: i.level })), sent });
}
