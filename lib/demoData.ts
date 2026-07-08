// ---------------------------------------------------------------------------
// Демо-каталог: используется только когда не заданы учётные данные Google
// (для локальной проверки вёрстки). Структура повторяет реальные листы:
// подкатегории-разделители, размеры с наличием, размерная сетка, страны.
// Цены заданы как БАЗОВЫЕ (дроп) и проходят ту же логику наценки, что и live.
// ---------------------------------------------------------------------------

import { SHEETS, SheetDef, computeFinalPrice } from './config';
import { Catalog, Product, Section, SizeAvailability } from './types';
import { productSlug } from './slug';

const SIZE_LABELS = ['39', '40', '41', '42', '43', '44', '45'];

function sizes(present: number[]): SizeAvailability[] {
  return SIZE_LABELS.map((label, i) => {
    const qty = present.includes(i) ? 1 + ((i * 3) % 4) : 0;
    return { label, qty, inStock: qty > 0 };
  });
}

const GRID = [
  'EU 39 | UK 6 | US 6.5 | Б 24.5 см | С 25 см',
  'EU 40 | UK 6.5 | US 7 | Б 25 см | С 25.5 см',
  'EU 41 | UK 7 | US 8 | Б 25.5 см | С 26 см',
  'EU 42 | UK 8 | US 8.5 | Б 26.5 см | С 27 см',
  'EU 43 | UK 9 | US 9.5 | Б 27.5 см | С 28 см',
  'EU 44 | UK 9.5 | US 10 | Б 28 см | С 28.5 см',
  'EU 45 | UK 10 | US 11 | Б 29 см | С 29.5 см',
];

interface Seed {
  group: string;
  name: string;
  code: string;
  country: string;
  base: number;
  present: number[];
}

function makeProducts(sheet: SheetDef, seeds: Seed[]): Product[] {
  return seeds.map((s, idx) => {
    const sz = sizes(s.present);
    return {
      id: `${sheet.slug}-${s.code}`,
      slug: productSlug(s.name, s.code),
      code: s.code,
      name: s.name,
      country: s.country,
      finalPrice: computeFinalPrice(s.base, sheet.kind),
      image: null, // демо: без фото → плейсхолдер
      sizes: sz,
      sizeGrid: GRID,
      notes: idx % 4 === 0 ? 'Оригінал, у наявності' : null,
      group: s.group,
      anyInStock: sz.some((x) => x.inStock),
      mediaUrl: null,
    };
  });
}

const SEEDS: Record<string, Seed[]> = {
  БУТСИ: [
    { group: 'Nike Tiempo', name: 'Nike Tiempo Legend 10 Elite FG', code: '10231', country: 'Туреччина', base: 2050, present: [1, 2, 3, 4] },
    { group: 'Nike Tiempo', name: 'Nike Tiempo Legend 10 Pro FG', code: '10232', country: 'Туреччина', base: 1750, present: [0, 2, 4, 5] },
    { group: 'Nike Mercurial', name: 'Nike Mercurial Vapor 15 Elite FG', code: '10310', country: "В'єтнам", base: 2200, present: [2, 3, 4] },
    { group: 'Nike Mercurial', name: 'Nike Mercurial Superfly 9 FG', code: '10311', country: "В'єтнам", base: 1950, present: [] },
    { group: 'Adidas X', name: 'Adidas X Crazyfast Elite FG', code: '10450', country: 'Туреччина', base: 1890, present: [0, 1, 2, 3, 4, 5, 6] },
    { group: 'Adidas X', name: 'Adidas X Speedportal.1 FG', code: '10451', country: 'Туреччина', base: 1650, present: [1, 3, 5] },
  ],
  СОРОКОНІЖКИ: [
    { group: 'Nike Mercurial', name: 'Nike Mercurial Vapor 15 TF', code: '20110', country: 'Туреччина', base: 1450, present: [0, 1, 2, 3] },
    { group: 'Adidas Predator', name: 'Adidas Predator Accuracy TF', code: '20220', country: "В'єтнам", base: 1550, present: [2, 3, 4, 5] },
  ],
  ФУТЗАЛКИ: [
    { group: 'Nike React', name: 'Nike React Gato IC', code: '30110', country: 'Туреччина', base: 1350, present: [1, 2, 3] },
    { group: 'Joma', name: 'Joma Top Flex IN', code: '30220', country: 'Іспанія', base: 1250, present: [0, 2, 4] },
  ],
  'ДИТЯЧЕ ВЗУТТЯ': [
    { group: 'Nike Junior', name: 'Nike Mercurial Vapor 15 Jr FG', code: '40110', country: 'Туреччина', base: 1150, present: [0, 1] },
    { group: 'Adidas Junior', name: 'Adidas X Crazyfast Jr FG', code: '40220', country: 'Туреччина', base: 1050, present: [0, 1, 2] },
  ],
  ЕКІПІРУВАННЯ: [
    { group: 'Форма', name: 'Ігрова форма Nike Dri-FIT (футболка+шорти)', code: '50110', country: 'Туреччина', base: 850, present: [0, 1, 2, 3, 4] },
    { group: 'Гетри', name: 'Гетри Nike Matchfit', code: '50220', country: 'Туреччина', base: 320, present: [1, 2, 3] },
  ],
  'НБ ВЗУТТЯ': [
    { group: 'New Balance', name: 'New Balance Furon v7 Pro FG', code: '60110', country: 'Туреччина', base: 1980, present: [1, 2, 3, 4] },
    { group: 'New Balance', name: 'New Balance Tekela v4 Magia FG', code: '60111', country: 'Туреччина', base: 2100, present: [2, 3, 4, 5] },
  ],
  'НБ ДИТЯЧЕ ВЗУТТЯ': [
    { group: 'New Balance Junior', name: 'New Balance Furon Dispatch Jr FG', code: '70110', country: 'Туреччина', base: 1090, present: [0, 1] },
  ],
  'НБ ЕКІПІРУВАННЯ': [
    { group: 'Аксесуари', name: 'Рюкзак New Balance Team', code: '80110', country: 'Туреччина', base: 690, present: [3] },
  ],
};

export function getDemoCatalog(): Catalog {
  const sections: Section[] = SHEETS.map((sheet) => {
    const products = makeProducts(sheet, SEEDS[sheet.title] || []).filter((p) => p.anyInStock);
    const countries = Array.from(new Set(products.map((p) => p.country).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b, 'uk'),
    );
    return { slug: sheet.slug, label: sheet.label, products, countries };
  });
  return { sections, fetchedAt: Date.now(), source: 'demo' };
}
