// Дублирование заказов строкой в Google-таблицу — так же, как это делает сайт.
// Требует сервис-аккаунт Google (GOOGLE_SERVICE_ACCOUNT_JSON) с доступом на
// редактирование таблицы. Если не настроено — тихо пропускается (заказ всё
// равно уходит в Telegram). Колонки строки совпадают с сайтом:
//   дата · имя · телефон · город · отделение · товары · сумма · комментарий

import crypto from 'node:crypto';

// ID таблицы по умолчанию (можно переопределить через ORDERS_SPREADSHEET_ID).
const DEFAULT_SHEET_ID = '1xxcmyvb60peQ304T4TeF_SIFcxKb_mi_I6Mcv7mHTe0';

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const sa = JSON.parse(json);
    if (sa.client_email && sa.private_key) return sa as ServiceAccount;
  } catch {
    /* игнор — вернём null */
  }
  return null;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const sa = loadServiceAccount();
  if (!sa) return null;

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  );
  const signature = base64url(crypto.sign('RSA-SHA256', Buffer.from(`${header}.${claim}`), sa.private_key));
  const assertion = `${header}.${claim}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, exp: now + data.expires_in };
  return data.access_token;
}

export interface OrderRow {
  name: string;
  phone: string;
  city: string;
  warehouse: string;
  itemsSummary: string;
  total: number;
  comment: string;
}

/** Дата/время в формате Киева — первая колонка строки. */
function kyivNow(): string {
  return new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
}

/**
 * Добавляет строку заказа в таблицу. Два способа:
 *  1) ПРОСТОЙ (рекомендуется) — POST на Google Apps Script (SHEETS_WEBHOOK_URL).
 *     Не нужен сервис-аккаунт: скрипт живёт в самой таблице.
 *  2) Через сервис-аккаунт Google (GOOGLE_SERVICE_ACCOUNT_JSON).
 * Если ни то, ни другое не настроено — тихо пропускаем.
 */
export async function appendOrderToSheet(order: OrderRow): Promise<{ saved: boolean }> {
  // Способ 1 — вебхук Apps Script.
  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.SHEETS_WEBHOOK_SECRET || '',
          date: kyivNow(),
          name: order.name,
          phone: order.phone,
          city: order.city,
          warehouse: order.warehouse,
          items: order.itemsSummary,
          total: order.total,
          comment: order.comment,
        }),
        redirect: 'follow',
      });
      return { saved: res.ok };
    } catch (e) {
      console.error('[sheet] webhook failed:', (e as Error).message);
      return { saved: false };
    }
  }

  // Способ 2 — сервис-аккаунт.
  const spreadsheetId = process.env.ORDERS_SPREADSHEET_ID || DEFAULT_SHEET_ID;
  const token = await getAccessToken().catch(() => null);
  if (!token) return { saved: false };

  const sheetName = process.env.ORDERS_SHEET_NAME || 'Замовлення';
  const range = encodeURIComponent(`${sheetName}!A1`);
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append` +
    `?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const row = [
    new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' }),
    order.name,
    order.phone,
    order.city,
    order.warehouse,
    order.itemsSummary,
    order.total,
    order.comment,
  ];

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    });
    if (!res.ok) console.error('[sheet] append error:', res.status, (await res.text()).slice(0, 200));
    return { saved: res.ok };
  } catch (e) {
    console.error('[sheet] append failed:', (e as Error).message);
    return { saved: false };
  }
}
