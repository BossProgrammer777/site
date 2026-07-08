// Дублирование заказов строкой в Google-таблицу (для учёта).
// Требует сервис-аккаунт (GOOGLE_SERVICE_ACCOUNT_JSON) с доступом на редактирование
// к таблице ORDERS_SPREADSHEET_ID. Если не настроено — тихо пропускается
// (заказ всё равно уходит в Telegram).

import { getAccessToken } from './googleAuth';

export interface OrderRow {
  name: string;
  phone: string;
  city: string;
  warehouse: string;
  itemsSummary: string;
  total: number;
  comment: string;
}

export async function appendOrderToSheet(order: OrderRow): Promise<{ saved: boolean }> {
  const spreadsheetId = process.env.ORDERS_SPREADSHEET_ID;
  if (!spreadsheetId) return { saved: false };

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
    return { saved: res.ok };
  } catch {
    return { saved: false };
  }
}
