// Список изображений в публичной папке Google Drive (для галереи товара).
// Использует тот же GOOGLE_API_KEY. Требует включённого Drive API в проекте —
// иначе вернёт пустой список (галерея просто не покажется).

export function extractFolderId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

const cache = new Map<string, { at: number; ids: string[] }>();
const TTL = 30 * 60 * 1000; // 30 мин

export async function listFolderImages(folderId: string): Promise<string[]> {
  const key = process.env.GOOGLE_API_KEY || process.env.GOOGLE_SHEETS_API_KEY;
  if (!key || !folderId) return [];

  const cached = cache.get(folderId);
  if (cached && Date.now() - cached.at < TTL) return cached.ids;

  const q = encodeURIComponent(
    `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
  );
  const url =
    `https://www.googleapis.com/drive/v3/files?q=${q}&key=${key}` +
    `&fields=files(id,name)&orderBy=name&pageSize=30`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      cache.set(folderId, { at: Date.now(), ids: [] });
      return [];
    }
    const data = await res.json();
    const ids: string[] = (data.files || []).map((f: { id: string }) => f.id);
    cache.set(folderId, { at: Date.now(), ids });
    return ids;
  } catch {
    return [];
  }
}
