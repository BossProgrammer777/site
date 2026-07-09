// ---------------------------------------------------------------------------
// Локализация ОТОБРАЖЕНИЯ данных товара (названия из таблицы на украинском).
// Переводим только служебные слова-категории в начале названия и страну.
// Бренд/модель (Nike, Mercurial) не трогаем. UA — возвращаем как есть.
// ---------------------------------------------------------------------------

import type { Locale } from './i18n';

const normApos = (s: string) => s.replace(/[''`ʼ]/g, "'");

// UA-слово (в нижнем регистре, апострофы нормализованы) → RU (с регистром).
const NAME_MAP: Record<string, string> = {
  бутси: 'Бутсы',
  сороконіжки: 'Сороконожки',
  дитячі: 'Детские',
  дитяче: 'Детская',
  воротарські: 'Вратарские',
  рукавиці: 'перчатки',
  гетри: 'Гетры',
  термобілизна: 'Термобельё',
  "м'ячі": 'Мячи',
  "м'яч": 'Мяч',
  взуття: 'Обувь',
  сумка: 'Сумка',
  сумки: 'Сумки',
};

const COUNTRY_MAP: Record<string, string> = {
  боснія: 'Босния',
  індонезія: 'Индонезия',
  "в'єтнам": 'Вьетнам',
  туреччина: 'Турция',
  китай: 'Китай',
  таїланд: 'Таиланд',
  україна: 'Украина',
  пакистан: 'Пакистан',
  індія: 'Индия',
  бангладеш: 'Бангладеш',
  камбоджа: 'Камбоджа',
};

/** Название товара для отображения в текущей локали. */
export function localizeProductName(name: string, locale: Locale): string {
  if (locale !== 'ru' || !name) return name;
  return name
    .split(/(\s+)/)
    .map((tok) => NAME_MAP[normApos(tok).toLowerCase()] ?? tok)
    .join('');
}

/** Страна-производитель для отображения в текущей локали. */
export function localizeCountry(country: string | null, locale: Locale): string {
  if (locale !== 'ru' || !country) return country || '';
  return COUNTRY_MAP[normApos(country).toLowerCase().trim()] ?? country;
}

// Приведение вариативных/русских написаний группы-модели к единому UA-канону,
// чтобы одинаковые категории не двоились в фильтрах и на UA показывались
// по-украински. Ключ — в нижнем регистре, апострофы нормализованы.
const MODEL_CANON: Record<string, string> = {
  'гетры и носки': 'Гетри та шкарпетки',
  'гетри та носки': 'Гетри та шкарпетки',
  'гетри та шкарпетки': 'Гетри та шкарпетки',
};
export function canonModel(model: string): string {
  return MODEL_CANON[normApos(model).toLowerCase().trim()] ?? model;
}

// UA-канон группы-модели → RU для отображения на /ru.
const MODEL_RU: Record<string, string> = {
  'Гетри та шкарпетки': 'Гетры и носки',
};
export function localizeModel(model: string, locale: Locale): string {
  if (locale !== 'ru') return model;
  return MODEL_RU[model] ?? model;
}
