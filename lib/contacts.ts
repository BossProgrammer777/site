// Контактные данные магазина (используются в шапке, футере, странице контактов).

export const PHONES = [
  { display: '+38 (063) 384-27-61', href: 'tel:+380633842761' },
  { display: '+38 (099) 528-83-24', href: 'tel:+380995288324' },
];

export const INSTAGRAM = 'https://www.instagram.com/bootsbaza';

// Соцсети (используются в подвале, странице контактів та мікророзмітці).
export type SocialId = 'instagram' | 'tiktok' | 'youtube' | 'telegram';
export const SOCIALS: { id: SocialId; name: string; handle: string; href: string }[] = [
  { id: 'instagram', name: 'Instagram', handle: '@bootsbaza', href: INSTAGRAM },
  { id: 'tiktok', name: 'TikTok', handle: '@bootsbaza', href: 'https://www.tiktok.com/@bootsbaza' },
  { id: 'youtube', name: 'YouTube', handle: '@bootsbaza', href: 'https://youtube.com/@bootsbaza' },
  { id: 'telegram', name: 'Telegram', handle: '@your_seller_ua', href: 'https://t.me/your_seller_ua' },
];

// Ссылки на информационные разделы (для навигации/футера).
export const INFO_LINKS = [
  { href: '/about', label: 'Про нас' },
  { href: '/delivery', label: 'Доставка та оплата' },
  { href: '/warranty', label: 'Гарантія та повернення' },
  { href: '/offer', label: 'Договір оферти' },
  { href: '/contacts', label: 'Контакти' },
];
