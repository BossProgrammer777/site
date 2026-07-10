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

  instagram: {
    accessToken: required('IG_ACCESS_TOKEN'),
    verifyToken: required('IG_VERIFY_TOKEN'),
    appSecret: optional('META_APP_SECRET'),
    graphBase: optional('GRAPH_API_BASE', 'https://graph.instagram.com/v21.0').replace(/\/$/, ''),
  },

  port: Number(optional('PORT', '8080')),

  // Модель ИИ-консультанта.
  model: 'claude-opus-4-8',
} as const;
