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
};

export const dict: Record<Locale, Dict> = { uk, ru };
