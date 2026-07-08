import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Запускает новую сборку сайта через Vercel Deploy Hook. Вызывается по расписанию
// (Vercel Cron, см. vercel.json). Пересборка нужна, чтобы заново извлечь
// встроенные в ячейки фото новых товаров (шаг prebuild).
//
// Настройка в Vercel (Environment Variables):
//   DEPLOY_HOOK_URL — URL деплой-хука (Settings → Git → Deploy Hooks).
//   CRON_SECRET     — секрет; Vercel Cron сам шлёт его как Bearer-токен.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  const hook = process.env.DEPLOY_HOOK_URL;
  if (!hook) {
    return NextResponse.json(
      { ok: false, error: 'DEPLOY_HOOK_URL не заданий' },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(hook, { method: 'POST' });
    return NextResponse.json({ ok: res.ok, status: res.status, at: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
