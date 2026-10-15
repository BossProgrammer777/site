import { NextResponse } from 'next/server';
import manifestJson from '../../../../public/photos/manifest.json';

export const dynamic = 'force-dynamic';

// Старые адреса фото, файлов с которыми больше нет (новые отдаются статикой из public):
//  • /photos/<раздел>/<номер строки>.<ext> (до перехода на имена по хэшу) — в CRM,
//    старых заказах и индексе Google. Ведём на текущее фото этой строки (как раньше).
//  • /photos/<раздел>/<хэш>.<ext> с прежним расширением (.png и т.п. до сжатия в .jpg) —
//    это тот же снимок, ведём на его сжатую версию.
// Так картинки по сохранённым ссылкам не становятся битыми.
const manifest = manifestJson as Record<string, Record<string, string>>;

export function GET(req: Request, { params }: { params: { slug: string; file: string } }) {
  const photos = manifest[params.slug];
  const row = params.file.match(/^(\d+)\.[a-z0-9]+$/i)?.[1];
  if (row && photos?.[row]) return NextResponse.redirect(new URL(photos[row], req.url), 307);

  const hash = params.file.match(/^([0-9a-f]{16})\.[a-z0-9]+$/i)?.[1];
  const prefix = `/photos/${params.slug}/${hash}.`;
  const same = hash && photos ? Object.values(photos).find((u) => u.startsWith(prefix)) : undefined;
  if (same) return NextResponse.redirect(new URL(same, req.url), 308);

  return new NextResponse('Not found', { status: 404 });
}
