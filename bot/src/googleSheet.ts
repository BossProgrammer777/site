// Запись заказа в Google-таблицу «Заказы» через Apps Script (SHEETS_WEBHOOK_URL).
// Одна строка = один товар. Дроп-цену и см бот берёт из закрытого эндпоинта
// сайта (см. catalog.ts → fetchOrderMeta) и передаёт сюда уже готовыми.

export interface SheetRow {
  date: string; // ДД.ММ
  name: string;
  city: string;
  np: string; // № отделения НП
  phone: string;
  project: string; // BBaza
  supplier: string; // FootballOpt
  position: string; // «Б Nike Mercurial»
  eu: string; // размер EU
  cm: number | null;
  drop: number | null; // вход (закупка)
  price: number; // наша цена продажи
}

/** Дописывает одну строку заказа. {saved:false}, если вебхук не настроен. */
export async function appendOrderRow(row: SheetRow): Promise<{ saved: boolean }> {
  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) return { saved: false };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.SHEETS_WEBHOOK_SECRET || '', ...row }),
      redirect: 'follow',
    });
    return { saved: res.ok };
  } catch (e) {
    console.error('[sheet] append failed:', (e as Error).message);
    return { saved: false };
  }
}
