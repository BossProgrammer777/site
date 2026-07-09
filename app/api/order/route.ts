import { NextRequest, NextResponse } from 'next/server';
import { getCatalog } from '@/lib/cache';
import { sendTelegram, sendTelegramPhotos } from '@/lib/telegram';
import { appendOrderToSheet } from '@/lib/ordersSheet';
import { formatUAH } from '@/lib/format';
import { siteUrl } from '@/lib/site';

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
  items?: OrderItem[];
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

  const text =
    `🛒 <b>Нове замовлення Bootsbaza</b>\n\n` +
    `${itemsText}\n\n` +
    `💳 <b>Разом: ${formatUAH(total)}</b>\n\n` +
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
  const sheetComment = [payment ? `Оплата: ${payment}` : '', body.comment?.trim() || '']
    .filter(Boolean)
    .join(' · ');
  const sheetPromise = appendOrderToSheet({
    name,
    phone,
    city,
    warehouse,
    itemsSummary,
    total,
    comment: sheetComment,
  }).catch(() => ({ saved: false }));

  // Фото товаров для Telegram (абсолютные URL).
  const base = siteUrl();
  const toAbs = (img: string) => (img.startsWith('http') ? img : `${base}${img}`);
  const photos = lines
    .filter((l) => l.image)
    .map((l) => ({ url: toAbs(l.image as string), caption: `${l.name} · р.${l.size} ×${l.qty}` }));

  try {
    const [result, sheet] = await Promise.all([sendTelegram(text), sheetPromise]);
    await sendTelegramPhotos(photos);
    return NextResponse.json({ ok: true, sent: result.sent, saved: sheet.saved, total });
  } catch (e) {
    // Даже если Telegram упал — заказ мог записаться в таблицу; но сообщаем об ошибке.
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
