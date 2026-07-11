// Запись заказа в Google-таблицу через СУЩЕСТВУЮЩИЙ Apps Script (файл Post.gs,
// функция doGet). Он принимает GET с параметрами и кладёт строку в лист заказов.
// Мы лишь добавляем в тот скрипт недостающие колонки. Одна строка = один товар.
//
// Нужны env: SHEETS_WEBAPP_URL (…/exec), ORDERS_SHEETID (id таблицы заказов).

export interface SheetRow {
  name: string;
  city: string;
  np: string; // № отделения НП (параметр departament — как ждёт скрипт)
  phone: string;
  project: string; // BBaza
  supplier: string; // FootballOpt
  position: string; // «Б Nike Mercurial»
  eu: string; // размер EU
  cm: number | null;
  drop: number | null; // вход (закупка)
  price: number; // наша цена продажи
  orderId?: string;
}

/** Дописывает одну строку заказа через doGet. {saved:false}, если не настроено. */
export async function appendOrderRow(row: SheetRow): Promise<{ saved: boolean }> {
  const url = process.env.SHEETS_WEBAPP_URL;
  const sheetid = process.env.ORDERS_SHEETID;
  if (!url || !sheetid) return { saved: false };

  const params = new URLSearchParams({
    sheetid,
    name: row.name,
    phone: row.phone,
    city: row.city,
    departament: row.np, // существующий скрипт ждёт именно 'departament'
    project: row.project,
    supplier: row.supplier,
    position: row.position,
    eu: row.eu,
    cm: row.cm != null ? String(row.cm) : '',
    price: String(row.price),
    drop: row.drop != null ? String(row.drop) : '',
    order_id: row.orderId || '',
  });

  try {
    const res = await fetch(`${url}?${params.toString()}`, { redirect: 'follow' });
    return { saved: res.ok };
  } catch (e) {
    console.error('[sheet] append failed:', (e as Error).message);
    return { saved: false };
  }
}
