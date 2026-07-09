import { NextRequest, NextResponse } from 'next/server';
import { getCatalog } from '@/lib/cache';
import { sendTelegram, sendTelegramPhotos } from '@/lib/telegram';
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

  const base = siteUrl();
  const toAbs = (img: string) => (img.startsWith('http') ? img : `${base}${img}`);
  const photos = product.image
    ? [{ url: toAbs(product.image), caption: `${product.name}${size ? ` · р.${size}` : ''}` }]
    : [];

  try {
    const [result, sheet] = await Promise.all([sendTelegram(text), sheetPromise]);
    if (photos.length) await sendTelegramPhotos(photos);
    return NextResponse.json({ ok: true, sent: result.sent, saved: sheet.saved });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
