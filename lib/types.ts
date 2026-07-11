// Публичные типы каталога. ВАЖНО: дроп-цена (базовая) сюда НЕ попадает —
// наружу отдаётся только finalPrice.

export interface SizeAvailability {
  /** Метка размера, как в шапке листа: "39", "40" … или "M", "L". */
  label: string;
  /** Количество пар/штук в наличии. 0 = нет в наличии. */
  qty: number;
  /** Удобный флаг для UI. */
  inStock: boolean;
}

export interface Product {
  id: string;
  /** Читаемый URL-идентификатор («назва-код»). */
  slug: string;
  code: string;
  name: string;
  country: string;
  /** Финальная цена покупателя (с наценкой, округлённая). грн. */
  finalPrice: number;
  /** URL картинки (может быть проксирован) либо null → плейсхолдер. */
  image: string | null;
  sizes: SizeAvailability[];
  /** Строки размерной сетки EU/UK/US/см. */
  sizeGrid: string[];
  notes: string | null;
  /** Подкатегория (Nike Tiempo, Adidas X …), если задана строкой-разделителем. */
  group: string | null;
  /** Есть ли хоть один размер в наличии. */
  anyInStock: boolean;
  /** Ссылка на доп. фото/видео (Google Drive) из колонки «Медіа», если есть. */
  mediaUrl: string | null;
  /** Внутреннее: индекс исходной строки листа (для сопоставления фото). Не для UI. */
  _row?: number;
  /** Внутреннее: дроп-цена (закупка). НИКОГДА не отдаётся покупателю — удаляется
   *  при сборке каталога и живёт только в Catalog.dropByCode для учёта заказов. */
  _drop?: number;
}

export interface Section {
  slug: string;
  label: string;
  /** Товары в порядке из таблицы (внутри — сгруппированы по group). */
  products: Product[];
  /** Уникальные страны в разделе (для фильтра). */
  countries: string[];
}

export interface Catalog {
  sections: Section[];
  /** Внутренняя метка времени обновления (наружу в UI НЕ показывается). */
  fetchedAt: number;
  /** Источник данных: 'live' | 'demo'. Для диагностики, не для UI покупателя. */
  source: 'live' | 'demo';
  /** Внутреннее: код товара → дроп-цена. Только для учёта заказов (закрытый
   *  эндпоинт /api/order-meta). НЕ сериализуется в публичные ответы. */
  dropByCode?: Record<string, number>;
}
