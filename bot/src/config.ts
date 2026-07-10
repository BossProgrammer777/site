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

  port: Number(optional('PORT', '8080')),

  // Модель ИИ-консультанта.
  model: 'claude-opus-4-8',
} as const;

/** Проверка, что Instagram настроен (вызывается при запуске боевого сервера). */
export function assertInstagramConfig(): void {
  if (!config.instagram.accessToken || !config.instagram.verifyToken) {
    throw new Error(
      'Для запуска сервера нужны IG_ACCESS_TOKEN и IG_VERIFY_TOKEN (см. .env.example). ' +
        'Для локального теста без Instagram используйте: npm run chat',
    );
  }
}
