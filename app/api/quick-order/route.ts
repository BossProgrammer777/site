import { NextRequest, NextResponse } from 'next/server';
import { getCatalog } from '@/lib/cache';
import { sendTelegramOrder, telegramPhotoUrl } from '@/lib/telegram';
import { appendOrderToSheet } from '@/lib/ordersSheet';
import { formatUAH } from '@/lib/format';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

interface QuickBody {
  productId?: string;
  size?: string;
  phone?: string;
  qty?: number;
}

const esc = (s: string) =>
  (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Быстрый заказ «в 1 клик»: нужен только телефон. Менеджер перезванивает и
// уточняет размер/доставку. Уходит в тот же Telegram и Google-таблицу.
export async function POST(req: NextRequest) {
  let body: QuickBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 });
  }

  const phone = (body.phone || '').trim();
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) {
    return NextResponse.json({ ok: false, error: 'Вкажіть коректний номер телефону' }, { status: 400 });
  }

  const catalog = await getCatalog();
  let product = null as
    | { name: string; code: string; price: number; image: string | null; slug: string }
    | null;
  for (const s of catalog.sections) {
    const p = s.products.find((x) => x.id === body.productId);
    if (p) {
      product = { name: p.name, code: p.code, price: p.finalPrice, image: p.image, slug: p.slug };
      break;
    }
  }
  if (!product) {
    return NextResponse.json({ ok: false, error: 'Товар не знайдено' }, { status: 400 });
  }

  const qty = Math.max(1, Math.floor(Number(body.qty) || 1));
  const size = (body.size || '').trim();
  const sizeText = size ? `Розмір: ${esc(size)}` : 'Розмір: <i>уточнити у клієнта</i>';

  const text =
    `⚡ <b>ШВИДКЕ ЗАМОВЛЕННЯ (1 клік)</b>\n\n` +
    `<b>${esc(product.name)}</b>\n` +
    `Код: ${esc(product.code)} · ${sizeText} · ${qty} шт.\n` +
    `Ціна: <b>${formatUAH(product.price * qty)}</b>\n\n` +
    `📞 <b>Телефон:</b> ${esc(phone)}\n` +
    `⚠️ <b>Передзвонити клієнту</b> — уточнити розмір і доставку.\n` +
    `🔗 ${siteUrl()}/product/${encodeURIComponent(product.slug)}`;

  const sheetPromise = appendOrderToSheet({
    name: '— (швидке замовлення)',
    phone,
    city: '',
    warehouse: '',
    itemsSummary: `${product.name} (${product.code})${size ? `, р.${size}` : ''} ×${qty}`,
    total: product.price * qty,
    comment: 'Швидке замовлення (1 клік) — передзвонити, уточнити розмір і доставку',
  }).catch(() => ({ saved: false }));

  // Дублируем заказ в CRM (как обычный заказ). Быстрый заказ — только телефон;
  // размер/доставку менеджер уточняет по звонку и дозаполняет в CRM.
  const crmUrl = process.env.CRM_INGEST_URL;
  const crmToken = process.env.CRM_SYNC_TOKEN;
  const crmPromise =
    crmUrl && crmToken
      ? fetch(crmUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-crm-token': crmToken },
          body: JSON.stringify({
            customer: { name: '', phone, city: '', warehouse: '' },
            source: 'WEBSITE',
            paymentMethod: 'COD',
            comment: 'Швидке замовлення (1 клік) — уточнити розмір і доставку',
            items: [
              {
                code: product.code,
                name: product.name,
                size: size || '',
                price: product.price,
                qty,
                drop: catalog.dropByCode?.[product.code] ?? 0,
              },
            ],
          }),
        })
          .then(() => undefined)
          .catch(() => undefined)
      : Promise.resolve();

  const base = siteUrl();
  const photoUrl = telegramPhotoUrl(product.image, base);

  try {
    const [result, sheet] = await Promise.all([
      sendTelegramOrder(text, photoUrl ? [photoUrl] : []),
      sheetPromise,
      crmPromise,
    ]);
    return NextResponse.json({ ok: true, sent: result.sent, saved: sheet.saved });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
