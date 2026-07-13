// Конфигурация из переменных окружения. Одно место, где читается process.env.
// Часть значений обязательна для запуска — падаем сразу с понятной ошибкой,
// а не посреди диалога с клиентом.

function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Не задана обязательная переменная окружения ${name} (см. .env.example)`);
  }
  return v.trim();
}

function optional(name: string, fallback = ''): string {
  return (process.env[name] || fallback).trim();
}

export const config = {
  anthropicApiKey: required('ANTHROPIC_API_KEY'),

  // Сайт — источник каталога (без завершающего слэша).
  siteUrl: required('SITE_URL').replace(/\/$/, ''),

  telegram: {
    token: required('TELEGRAM_BOT_TOKEN'),
    chatId: required('TELEGRAM_CHAT_ID'),
  },

  // Instagram нужен только для боевого сервера. Для локального теста (npm run
  // chat) эти переменные можно не задавать — их наличие проверяет assertInstagramConfig().
  instagram: {
    accessToken: optional('IG_ACCESS_TOKEN'),
    verifyToken: optional('IG_VERIFY_TOKEN'),
    appSecret: optional('META_APP_SECRET'),
    graphBase: optional('GRAPH_API_BASE', 'https://graph.instagram.com/v21.0').replace(/\/$/, ''),
  },

  // Ключ к закрытому эндпоинту сайта /api/order-meta (дроп-цена + см для учёта).
  orderMetaKey: optional('ORDER_META_KEY'),

  port: Number(optional('PORT', '8080')),

  // Необязательный пароль для веб-чата (тестовая страница /). Если задан —
  // страница спросит его перед началом, чтобы посторонние не тратили токены.
  webChatPassword: optional('WEB_CHAT_PASSWORD'),

  // Модель ИИ-консультанта. По умолчанию Sonnet — сильное зрение (распознаёт
  // расцветки по фото) при цене в ~2.5 раза ниже Opus. Можно переопределить
  // переменной BOT_MODEL на Render (напр. claude-haiku-4-5 — дешевле, но зрение
  // слабее; claude-opus-4-8 — дороже, максимальное качество).
  model: optional('BOT_MODEL', 'claude-sonnet-5'),
} as const;

/** Настроен ли Instagram (для боевого режима вебхуков). */
export function instagramConfigured(): boolean {
  return Boolean(config.instagram.accessToken && config.instagram.verifyToken);
}
