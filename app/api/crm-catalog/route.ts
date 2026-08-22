import { NextRequest, NextResponse } from 'next/server';
import { getCatalog } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ЗАКРЫТЫЙ эндпоинт для BootsBaza CRM: отдаёт весь каталог одним ответом,
// ВКЛЮЧАЯ дроп-цену (закупку) — для синка товаров в CRM и расчёта прибыли.
// Требует заголовок x-crm-token = CRM_SYNC_TOKEN. Наружу/покупателям НЕ доступен.
// robots.txt запрещает весь /api/ — на SEO и выдачу не влияет.
export async function GET(req: NextRequest) {
  const token = process.env.CRM_SYNC_TOKEN;
  if (!token || req.headers.get('x-crm-token') !== token) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const catalog = await getCatalog();
  const drop = catalog.dropByCode || {};

  const products = catalog.sections.flatMap((section) =>
    section.products
      // Не отдаём обратно в CRM товары, которые сами же пришли ИЗ CRM
      // (id = "crm-…") — иначе синк сайт→CRM перезапишет им поставщика/закупку.
      .filter((p) => !p.id.startsWith('crm-'))
      .map((p) => ({
      code: p.code,
      name: p.name,
      group: p.group,
      country: p.country,
      category: section.slug,
      categoryLabel: section.label,
      salePrice: p.finalPrice,
      drop: drop[p.code] ?? null,
      image: p.image,
      sizes: p.sizes.map((s) => ({ label: s.label, qty: s.qty })),
    })),
  );

  return NextResponse.json(
    { ok: true, count: products.length, products },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
