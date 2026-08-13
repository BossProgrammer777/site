import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ВРЕМЕННО: диагностика связки сайт → CRM. Открой в браузере:
// https://bootsbaza.com.ua/api/crm-ping
// Покажет, видит ли сайт переменные и что отвечает приёмник CRM.
// Под /api/ (robots закрывает от Google). Будет удалён после проверки.
export async function GET() {
  const url = process.env.CRM_INGEST_URL;
  const token = process.env.CRM_SYNC_TOKEN;

  if (!url) return NextResponse.json({ ok: false, reason: 'CRM_INGEST_URL порожній — змінна не задана АБО сайт не пересобрано' });
  if (!token) return NextResponse.json({ ok: false, reason: 'CRM_SYNC_TOKEN порожній' });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-crm-token': token },
      body: JSON.stringify({
        customer: { name: 'CRM Ping', phone: '+380500000007', city: 'Київ', warehouse: 'Відділення №1' },
        source: 'WEBSITE',
        paymentMethod: 'COD',
        items: [{ code: '418', name: 'Ping', size: '44', price: 1000, qty: 1, drop: 800 }],
      }),
    });
    const body = await res.text();
    return NextResponse.json({ ok: res.ok, crmStatus: res.status, urlSet: true, tokenSet: true, crmResponse: body.slice(0, 400) });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: 'помилка мережі до CRM', error: (e as Error).message });
  }
}
