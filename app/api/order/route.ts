import { NextRequest, NextResponse } from 'next/server';
import { getCatalog } from '@/lib/cache';
import { sendTelegramOrder, telegramPhotoUrl } from '@/lib/telegram';
import { appendOrderToSheet } from '@/lib/ordersSheet';
import { formatUAH } from '@/lib/format';
import { siteUrl } from '@/lib/site';
import { findPromo, promoDiscount } from '@/lib/promo';

export const dynamic = 'force-dynamic';

interface OrderItem {
  productId: string;
  name: string;
  code: string;
  size: string;
  price: number;
  qty: number;
}
interface OrderBody {
  customer?: { name?: string; phone?: string };
  delivery?: { city?: string; warehouse?: string };
  payment?: string;
  comment?: string;
  promo?: string;
  items?: OrderItem[];
  src?: string;
  srcDetail?: string;
}

const esc = (s: string) =>
  (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function POST(req: NextRequest) {
  let body: OrderBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 });
  }

  const name = body.customer?.name?.trim();
  const phone = body.customer?.phone?.trim();
  const city = body.delivery?.city?.trim();
  const warehouse = body.delivery?.warehouse?.trim();
  const payment = body.payment?.trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!name || !phone) return NextResponse.json({ ok: false, error: 'Вкажіть ім’я та телефон' }, { status: 400 });
  if (!city || !warehouse) return NextResponse.json({ ok: false, error: 'Вкажіть місто та відділення' }, { status: 400 });
  if (items.length === 0) return NextResponse.json({ ok: false, error: 'Кошик порожній' }, { status: 400 });

  // Пересчитываем цены по актуальному каталогу (не доверяем ценам с клиента).
  const catalog = await getCatalog();
  const priceById = new Map<
    string,
    { price: number; name: string; code: string; image: string | null }
  >();
  for (const s of catalog.sections)
    for (const p of s.products)
      priceById.set(p.id, { price: p.finalPrice, name: p.name, code: p.code, image: p.image });

  let total = 0;
  const lines = items.map((it) => {
    const found = priceById.get(it.productId);
    const price = found ? found.price : Number(it.price) || 0;
    const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
    const sum = price * qty;
    total += sum;
    return {
      name: found?.name || it.name,
      code: found?.code || it.code,
      size: it.size,
      qty,
      price,
      sum,
      image: found?.image ?? null,
    };
  });

  const itemsText = lines
    .map(
      (l, i) =>
        `${i + 1}. <b>${esc(l.name)}</b>\n   Код: ${esc(l.code)} · Розмір: ${esc(l.size)} · ${l.qty} × ${formatUAH(l.price)} = <b>${formatUAH(l.sum)}</b>`,
    )
    .join('\n');

  // Знижка за промокодом — рахуємо на сервері від перерахованого total.
  const promo = findPromo(body.promo);
  const discount = promoDiscount(total, body.promo);
  const payTotal = Math.max(0, total - discount);

  const totalBlock =
    discount > 0 && promo
      ? `💳 <b>Сума: ${formatUAH(total)}</b>\n` +
        `🎁 <b>Знижка (${esc(promo.code)}): −${formatUAH(discount)}</b>\n` +
        `💰 <b>До сплати: ${formatUAH(payTotal)}</b>`
      : `💳 <b>Разом: ${formatUAH(total)}</b>`;

  const text =
    `🛒 <b>Нове замовлення Bootsbaza</b>\n\n` +
    `${itemsText}\n\n` +
    `${totalBlock}\n\n` +
    `👤 <b>Клієнт:</b> ${esc(name)}\n` +
    `📞 <b>Телефон:</b> ${esc(phone)}\n` +
    `🏙 <b>Місто:</b> ${esc(city)}\n` +
    `📦 <b>Відділення НП:</b> ${esc(warehouse)}` +
    (payment ? `\n💳 <b>Оплата:</b> ${esc(payment)}` : '') +
    (body.comment?.trim() ? `\n📝 <b>Коментар:</b> ${esc(body.comment.trim())}` : '');

  // Дублируем в Google-таблицу (если настроено) — не блокируя основной ответ.
  const itemsSummary = lines
    .map((l) => `${l.name} (${l.code}), р.${l.size} ×${l.qty}`)
    .join('; ');
  const sheetComment = [
    payment ? `Оплата: ${payment}` : '',
    discount > 0 && promo ? `Промокод ${promo.code} −${formatUAH(discount)}` : '',
    body.comment?.trim() || '',
  ]
    .filter(Boolean)
    .join(' · ');
  const sheetPromise = appendOrderToSheet({
    name,
    phone,
    city,
    warehouse,
    itemsSummary,
    total: payTotal,
    comment: sheetComment,
  }).catch(() => ({ saved: false }));

  // Дублируем заказ в CRM (если настроено) — не блокируя основной ответ.
  // Telegram и таблица работают как прежде; это добавляется параллельно.
  const crmUrl = process.env.CRM_INGEST_URL;
  const crmToken = process.env.CRM_SYNC_TOKEN;
  const crmPromise =
    crmUrl && crmToken
      ? fetch(crmUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-crm-token': crmToken },
          body: JSON.stringify({
            customer: { name, phone, city, warehouse },
            source: 'WEBSITE',
            refSource: body.src || '',
            refDetail: body.srcDetail || '',
            paymentMethod: /передопла|предопла/i.test(payment || '') ? 'BANK_TRANSFER' : 'COD',
            comment: body.comment?.trim() || '',
            items: lines.map((l) => ({
              code: l.code,
              name: l.name,
              size: l.size,
              price: l.price,
              qty: l.qty,
              drop: catalog.dropByCode?.[l.code] ?? 0,
            })),
          }),
        })
          .then(() => undefined)
          .catch(() => undefined)
      : Promise.resolve();

  // Фото товаров для Telegram: прямые URL (в обход прокси/домена).
  const base = siteUrl();
  const photoUrls = lines
    .map((l) => telegramPhotoUrl(l.image, base))
    .filter((u): u is string => !!u);

  try {
    // Заказ одним сообщением: фото + текст подписью.
    const [result, sheet] = await Promise.all([
      sendTelegramOrder(text, photoUrls),
      sheetPromise,
      crmPromise,
    ]);
    return NextResponse.json({ ok: true, sent: result.sent, saved: sheet.saved, total: payTotal });
  } catch (e) {
    // Даже если Telegram упал — заказ мог записаться в таблицу; но сообщаем об ошибке.
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
