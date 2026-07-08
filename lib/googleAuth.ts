// ---------------------------------------------------------------------------
// Учётные данные Google.
//  - GOOGLE_API_KEY               → чтение значений листа (основной путь).
//  - GOOGLE_SERVICE_ACCOUNT_JSON  → OAuth-токен для Drive API (экспорт .xlsx,
//                                   нужен только если фото — вставленные объекты).
// ---------------------------------------------------------------------------

import crypto from 'crypto';

export function getApiKey(): string | null {
  return process.env.GOOGLE_API_KEY || process.env.GOOGLE_SHEETS_API_KEY || null;
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    // Допускаем как сырой JSON, так и base64.
    const json = raw.trim().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8');
    const sa = JSON.parse(json);
    if (sa.client_email && sa.private_key) return sa as ServiceAccount;
  } catch {
    /* игнорируем — вернём null */
  }
  return null;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

let cachedToken: { token: string; exp: number } | null = null;

/** Access-token сервис-аккаунта (read-only Sheets+Drive). null, если SA не задан. */
export async function getAccessToken(): Promise<string | null> {
  const sa = loadServiceAccount();
  if (!sa) return null;

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

  const scope =
    'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly';
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope,
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  );
  const signature = base64url(
    crypto.sign('RSA-SHA256', Buffer.from(`${header}.${claim}`), sa.private_key),
  );
  const assertion = `${header}.${claim}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`OAuth token error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, exp: now + data.expires_in };
  return data.access_token;
}

export function hasAnyCredential(): boolean {
  return !!getApiKey() || !!loadServiceAccount();
}
