// ---------------------------------------------------------------------------
// Словари интерфейса (UA/RU). Компоненты, не подключённые к словарю, показывают
// свой украинский текст — деградация мягкая. Расширяется по мере перевода.
// ---------------------------------------------------------------------------

import type { Locale } from './i18n';

export interface Dict {
  nav: { catalog: string; blog: string; about: string; delivery: string; warranty: string; offer: string; contacts: string };
  search: { placeholder: string; showAll: string };
  footer: { shop: string; info: string; contacts: string; blog: string; cart: string; tagline: string; rights: string };
  home: {
    badge: string;
    heroA: string;
    heroB: string;
    heroSub: string;
    toCatalog: string;
    inStockCount: string; // «{n} товарів у наявності»
    categories: string;
    itemsShort: string; // «товарів»
  };
  product: {
    code: string; country: string; size: string; chosen: string;
    chooseSize: string; addToCart: string; added: string; goToCart: string;
    quickOrder: string; inStock: string; sizeInStock: string; // «Розмір {s} в наявності»
    sizeChart: string; sizeChartHint: string; watchVideo: string; morePhotos: string;
  };
  shipping: { today16: string; todaySat12: string; nextDay: string; monday: string; fast: string };
  quick: {
    title: string; subtitle: string; phonePlaceholder: string; submit: string; sending: string;
    agree: string; thanksTitle: string; thanksText: string; ok: string; badPhone: string;
  };
  breadcrumb: { home: string; catalog: string; blog: string };
  blogList: { subtitle: string; read: string };
  banner: { title: string; subtitle: string; cta: string }[];
  filters: {
    panel: string; reset: string; found: string; showMore: string;
    viewType: string; brand: string; model: string; size: string; country: string;
    searchPlaceholder: string; sort: string; sortDefault: string; sortPriceAsc: string;
    sortPriceDesc: string; sortName: string; price: string; priceFrom: string; priceTo: string;
    priceMin: string; priceMax: string; other: string; noBrand: string; empty: string;
  };
  cart: { title: string; empty: string; toCatalog: string; code: string; size: string; remove: string; total: string; checkout: string; continueShopping: string };
  checkout: { title: string; errName: string; errCity: string; sendError: string; doneTitle: string; doneText: string; emptyCart: string; name: string; namePh: string; phone: string; city: string; cityPh: string; region: string; warehouse: string; warehousePh: string; loading: string; pickWh: string; pickCityFirst: string; comment: string; commentPh: string; submitting: string; confirm: string; yourOrder: string; payment: string; payCod: string; payPrepay: string; deliveryNote: string };
  fav: { title: string; empty: string; hint: string; loading: string };
}

const uk: Dict = {
  nav: { catalog: 'Каталог', blog: 'Блог', about: 'Про нас', delivery: 'Доставка та оплата', warranty: 'Гарантія та повернення', offer: 'Договір оферти', contacts: 'Контакти' },
  search: { placeholder: 'Пошук товарів…', showAll: 'Показати всі результати' },
  footer: { shop: 'Магазин', info: 'Інформація', contacts: 'Контакти', blog: 'Блог', cart: 'Кошик', tagline: 'Інтернет-магазин футбольного взуття та екіпіровки. Актуальна наявність і чесні ціни.', rights: 'Усі права захищені.' },
  home: {
    badge: 'Футбольний магазин',
    heroA: 'Бутси, сороконіжки, футзалки та екіпіровка —',
    heroB: 'завжди в наявності',
    heroSub: 'Великий вибір футбольного взуття та екіпіровки — брендові моделі та бюджетні варіанти без бренду. Розміри, розмірна сітка та ціни оновлюються автоматично.',
    toCatalog: 'Перейти до каталогу',
    inStockCount: 'товарів у наявності',
    categories: 'Категорії',
    itemsShort: 'товарів',
  },
  product: {
    code: 'Код', country: 'Країна', size: 'Розмір', chosen: 'обрано',
    chooseSize: 'Оберіть розмір', addToCart: 'Додати в кошик', added: '✓ Додано в кошик', goToCart: 'Перейти до кошика →',
    quickOrder: 'Швидке замовлення в 1 клік', inStock: 'В наявності', sizeInStock: 'Розмір {s} в наявності',
    sizeChart: 'Розмірна сітка', sizeChartHint: 'Натисніть на розмір вище або на рядок сітки — потрібний розмір виділиться.', watchVideo: 'Дивитися відео', morePhotos: 'Більше фото та відео',
  },
  shipping: {
    today16: 'Відправка сьогодні при замовленні до 16:00',
    todaySat12: 'Відправка сьогодні при замовленні до 12:00',
    nextDay: 'Відправка наступного робочого дня',
    monday: 'Відправка в понеділок',
    fast: 'Швидка відправка «Новою Поштою»',
  },
  quick: {
    title: 'Швидке замовлення', subtitle: 'Залиште номер — ми передзвонимо й оформимо замовлення за вас.',
    phonePlaceholder: '+38 (0__) ___-__-__', submit: 'Замовити дзвінок', sending: 'Надсилаємо…',
    agree: 'Натискаючи кнопку, ви погоджуєтесь, що з вами звʼяжеться менеджер.',
    thanksTitle: 'Дякуємо за замовлення!', thanksText: 'Ми зателефонуємо найближчим часом, щоб підтвердити розмір і доставку.',
    ok: 'Зрозуміло', badPhone: 'Вкажіть коректний номер телефону',
  },
  breadcrumb: { home: 'Головна', catalog: 'Каталог', blog: 'Блог' },
  blogList: { subtitle: 'Поради щодо вибору футбольного взуття та екіпіровки — для гравців, аматорів і батьків юних футболістів.', read: 'Читати →' },
  banner: [
    { title: 'Новинки сезону', subtitle: 'Свіжі моделі Nike, Adidas, Puma вже в наявності', cta: 'Дивитися новинки' },
    { title: 'Все для гри', subtitle: "М'ячі, форма, щитки та аксесуари", cta: 'До екіпіровки' },
    { title: 'Сороконіжки та футзалки', subtitle: 'Взуття для будь-якого покриття', cta: 'Обрати' },
  ],
  filters: {
    panel: 'Фільтри', reset: 'Скинути', found: 'Знайдено товарів', showMore: 'Показати ще',
    viewType: 'Вид товару', brand: 'Бренд', model: 'Модель', size: 'Розмір', country: 'Країна',
    searchPlaceholder: 'Пошук за назвою або кодом…', sort: 'Сортування', sortDefault: 'За замовчуванням',
    sortPriceAsc: 'Спочатку дешевші', sortPriceDesc: 'Спочатку дорожчі', sortName: 'За назвою (А–Я)',
    price: 'Ціна, грн', priceFrom: 'Ціна від', priceTo: 'Ціна до', priceMin: 'Мінімальна ціна',
    priceMax: 'Максимальна ціна', other: 'Інше', noBrand: 'Без бренду', empty: 'За обраними фільтрами нічого не знайдено.',
  },
  cart: { title: 'Кошик', empty: 'Ваш кошик порожній.', toCatalog: 'До каталогу', code: 'Код', size: 'Розмір', remove: 'Видалити', total: 'Разом', checkout: 'Оформити замовлення', continueShopping: 'Продовжити покупки' },
  checkout: { title: 'Оформлення замовлення', errName: 'Вкажіть ім’я та коректний номер телефону.', errCity: 'Вкажіть місто та відділення Нової Пошти.', sendError: 'Помилка відправки', doneTitle: 'Замовлення прийнято!', doneText: 'Дякуємо! Ми зв’яжемося з вами найближчим часом для підтвердження та відправки.', emptyCart: 'Кошик порожній — немає що оформлювати.', name: 'Ім’я та прізвище *', namePh: 'Іван Петренко', phone: 'Номер телефону *', city: 'Місто *', cityPh: 'Почніть вводити місто…', region: 'обл.', warehouse: 'Відділення / поштомат Нової Пошти *', warehousePh: 'Напр.: Відділення №5', loading: 'Завантаження…', pickWh: 'Оберіть відділення', pickCityFirst: 'Спочатку оберіть місто', comment: 'Коментар (необов’язково)', commentPh: 'Побажання до замовлення', submitting: 'Відправляємо…', confirm: 'Підтвердити замовлення', yourOrder: 'Ваше замовлення', payment: 'Спосіб оплати', payCod: 'Накладений платіж — оплата при отриманні', payPrepay: 'Передоплата на рахунок', deliveryNote: 'Доставка — за тарифами «Нової Пошти» (оплачує отримувач).' },
  fav: { title: 'Обране', empty: 'У обраному поки порожньо.', hint: 'Натисніть ♥ на товарі, щоб зберегти його тут.', loading: 'Завантаження…' },
};

const ru: Dict = {
  nav: { catalog: 'Каталог', blog: 'Блог', about: 'О нас', delivery: 'Доставка и оплата', warranty: 'Гарантия и возврат', offer: 'Договор оферты', contacts: 'Контакты' },
  search: { placeholder: 'Поиск товаров…', showAll: 'Показать все результаты' },
  footer: { shop: 'Магазин', info: 'Информация', contacts: 'Контакты', blog: 'Блог', cart: 'Корзина', tagline: 'Интернет-магазин футбольной обуви и экипировки. Актуальное наличие и честные цены.', rights: 'Все права защищены.' },
  home: {
    badge: 'Футбольный магазин',
    heroA: 'Бутсы, сороконожки, футзалки и экипировка —',
    heroB: 'всегда в наличии',
    heroSub: 'Большой выбор футбольной обуви и экипировки — брендовые модели и бюджетные варианты без бренда. Размеры, размерная сетка и цены обновляются автоматически.',
    toCatalog: 'Перейти в каталог',
    inStockCount: 'товаров в наличии',
    categories: 'Категории',
    itemsShort: 'товаров',
  },
  product: {
    code: 'Код', country: 'Страна', size: 'Размер', chosen: 'выбрано',
    chooseSize: 'Выберите размер', addToCart: 'Добавить в корзину', added: '✓ Добавлено в корзину', goToCart: 'Перейти в корзину →',
    quickOrder: 'Быстрый заказ в 1 клик', inStock: 'В наличии', sizeInStock: 'Размер {s} в наличии',
    sizeChart: 'Размерная сетка', sizeChartHint: 'Нажмите на размер выше или на строку сетки — нужный размер выделится.', watchVideo: 'Смотреть видео', morePhotos: 'Больше фото и видео',
  },
  shipping: {
    today16: 'Отправка сегодня при заказе до 16:00',
    todaySat12: 'Отправка сегодня при заказе до 12:00',
    nextDay: 'Отправка на следующий рабочий день',
    monday: 'Отправка в понедельник',
    fast: 'Быстрая отправка «Новой Почтой»',
  },
  quick: {
    title: 'Быстрый заказ', subtitle: 'Оставьте номер — мы перезвоним и оформим заказ за вас.',
    phonePlaceholder: '+38 (0__) ___-__-__', submit: 'Заказать звонок', sending: 'Отправляем…',
    agree: 'Нажимая кнопку, вы соглашаетесь, что с вами свяжется менеджер.',
    thanksTitle: 'Спасибо за заказ!', thanksText: 'Мы позвоним в ближайшее время, чтобы подтвердить размер и доставку.',
    ok: 'Понятно', badPhone: 'Укажите корректный номер телефона',
  },
  breadcrumb: { home: 'Главная', catalog: 'Каталог', blog: 'Блог' },
  blogList: { subtitle: 'Советы по выбору футбольной обуви и экипировки — для игроков, любителей и родителей юных футболистов.', read: 'Читать →' },
  banner: [
    { title: 'Новинки сезона', subtitle: 'Свежие модели Nike, Adidas, Puma уже в наличии', cta: 'Смотреть новинки' },
    { title: 'Всё для игры', subtitle: 'Мячи, форма, щитки и аксессуары', cta: 'К экипировке' },
    { title: 'Сороконожки и футзалки', subtitle: 'Обувь для любого покрытия', cta: 'Выбрать' },
  ],
  filters: {
    panel: 'Фильтры', reset: 'Сбросить', found: 'Найдено товаров', showMore: 'Показать ещё',
    viewType: 'Вид товара', brand: 'Бренд', model: 'Модель', size: 'Размер', country: 'Страна',
    searchPlaceholder: 'Поиск по названию или коду…', sort: 'Сортировка', sortDefault: 'По умолчанию',
    sortPriceAsc: 'Сначала дешевле', sortPriceDesc: 'Сначала дороже', sortName: 'По названию (А–Я)',
    price: 'Цена, грн', priceFrom: 'Цена от', priceTo: 'Цена до', priceMin: 'Минимальная цена',
    priceMax: 'Максимальная цена', other: 'Другое', noBrand: 'Без бренда', empty: 'По выбранным фильтрам ничего не найдено.',
  },
  cart: { title: 'Корзина', empty: 'Ваша корзина пуста.', toCatalog: 'В каталог', code: 'Код', size: 'Размер', remove: 'Удалить', total: 'Итого', checkout: 'Оформить заказ', continueShopping: 'Продолжить покупки' },
  checkout: { title: 'Оформление заказа', errName: 'Укажите имя и корректный номер телефона.', errCity: 'Укажите город и отделение Новой Почты.', sendError: 'Ошибка отправки', doneTitle: 'Заказ принят!', doneText: 'Спасибо! Мы свяжемся с вами в ближайшее время для подтверждения и отправки.', emptyCart: 'Корзина пуста — нечего оформлять.', name: 'Имя и фамилия *', namePh: 'Иван Петренко', phone: 'Номер телефона *', city: 'Город *', cityPh: 'Начните вводить город…', region: 'обл.', warehouse: 'Отделение / почтомат Новой Почты *', warehousePh: 'Напр.: Отделение №5', loading: 'Загрузка…', pickWh: 'Выберите отделение', pickCityFirst: 'Сначала выберите город', comment: 'Комментарий (необязательно)', commentPh: 'Пожелания к заказу', submitting: 'Отправляем…', confirm: 'Подтвердить заказ', yourOrder: 'Ваш заказ', payment: 'Способ оплаты', payCod: 'Наложенный платёж — оплата при получении', payPrepay: 'Предоплата на счёт', deliveryNote: 'Доставка — по тарифам «Новой Почты» (оплачивает получатель).' },
  fav: { title: 'Избранное', empty: 'В избранном пока пусто.', hint: 'Нажмите ♥ на товаре, чтобы сохранить его здесь.', loading: 'Загрузка…' },
};

export const dict: Record<Locale, Dict> = { uk, ru };

// Названия разделов (плитки на главной) по локали. Ключ — слаг раздела.
const SECTION_LABELS: Record<string, Record<Locale, string>> = {
  butsy: { uk: 'Бутси', ru: 'Бутсы' },
  sorokonizhky: { uk: 'Сороконіжки', ru: 'Сороконожки' },
  futzalky: { uk: 'Футзалки', ru: 'Футзалки' },
  'dytiache-vzuttia': { uk: 'Дитяче взуття', ru: 'Детская обувь' },
  ekipiruvannia: { uk: 'Екіпірування', ru: 'Экипировка' },
  'nb-vzuttia': { uk: 'Взуття без бренду', ru: 'Обувь без бренда' },
  'nb-dytiache-vzuttia': { uk: 'Дитяче без бренду', ru: 'Детская без бренда' },
  'nb-ekipiruvannia': { uk: 'Екіпірування без бренду', ru: 'Экипировка без бренда' },
};
export function sectionLabel(slug: string, fallback: string, locale: Locale): string {
  return SECTION_LABELS[slug]?.[locale] ?? fallback;
}

// Названия категорий фильтра «Вид товара» (по ключу CatDef.key).
const CAT_LABELS: Record<string, Record<Locale, string>> = {
  'a-butsy': { uk: 'Бутси', ru: 'Бутсы' },
  'a-soro': { uk: 'Сороконіжки', ru: 'Сороконожки' },
  'a-futz': { uk: 'Футзалки', ru: 'Футзалки' },
  'k-butsy': { uk: 'Бутси', ru: 'Бутсы' },
  'k-soro': { uk: 'Сороконіжки', ru: 'Сороконожки' },
  'k-futz': { uk: 'Футзалки', ru: 'Футзалки' },
  'eq-socks': { uk: 'Гетри та шкарпетки', ru: 'Гетры и носки' },
  'eq-shields': { uk: 'Щитки та фіксатори', ru: 'Щитки и фиксаторы' },
  'eq-gk': { uk: 'Для воротарів', ru: 'Для вратарей' },
  'eq-thermo': { uk: 'Термобілизна', ru: 'Термобельё' },
  'eq-bags': { uk: 'Сумки для взуття', ru: 'Сумки для обуви' },
  'eq-balls': { uk: "М'ячі", ru: 'Мячи' },
  'eq-other': { uk: 'Інша екіпіровка', ru: 'Другая экипировка' },
  'nb-shoes': { uk: 'Взуття без бренду', ru: 'Обувь без бренда' },
  'nb-kids': { uk: 'Дитяче взуття без бренду', ru: 'Детская обувь без бренда' },
};
export function catLabel(key: string, fallback: string, locale: Locale): string {
  return CAT_LABELS[key]?.[locale] ?? fallback;
}

// Заголовки групп «Вид товара» (по UA-строке → RU).
const CAT_HEADERS: Record<string, string> = {
  'Доросле взуття (розміри 39–45)': 'Взрослая обувь (размеры 39–45)',
  'Дитяче взуття (розміри 30–38)': 'Детская обувь (размеры 30–38)',
  Екіпірування: 'Экипировка',
};
export function catHeader(uaHeader: string, locale: Locale): string {
  return locale === 'ru' ? CAT_HEADERS[uaHeader] ?? uaHeader : uaHeader;
}
