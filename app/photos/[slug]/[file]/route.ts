import { NextResponse } from 'next/server';
import manifestJson from '../../../../public/photos/manifest.json';

export const dynamic = 'force-dynamic';

// Старые адреса фото /photos/<раздел>/<номер строки>.<ext> (до перехода на имена
// по хэшу) остались в CRM, старых заказах и индексе Google. Файлов с такими
// именами больше нет — ведём на текущее фото этой строки (как было раньше),
// чтобы картинки не стали битыми. Новые файлы-хэши отдаются статикой из public.
const manifest = manifestJson as Record<string, Record<string, string>>;

export function GET(req: Request, { params }: { params: { slug: string; file: string } }) {
  const row = params.file.match(/^(\d+)\.[a-z0-9]+$/i)?.[1];
  const url = row ? manifest[params.slug]?.[row] : undefined;
  if (!url) return new NextResponse('Not found', { status: 404 });
  return NextResponse.redirect(new URL(url, req.url), 307);
}
