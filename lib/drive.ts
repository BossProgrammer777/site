// Список медиа (фото + видео) в публичной папке Google Drive для товара.
// Использует тот же GOOGLE_API_KEY. Требует включённого Drive API — иначе
// возвращает пустые списки (галерея/видео просто не показываются).

export function extractFolderId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export interface FolderMedia {
  imageIds: string[];
  videoIds: string[];
}

const cache = new Map<string, { at: number; media: FolderMedia }>();
const TTL = 30 * 60 * 1000; // 30 мин

export async function listFolderMedia(folderId: string): Promise<FolderMedia> {
  const empty: FolderMedia = { imageIds: [], videoIds: [] };
  const key = process.env.GOOGLE_API_KEY || process.env.GOOGLE_SHEETS_API_KEY;
  if (!key || !folderId) return empty;

  const cached = cache.get(folderId);
  if (cached && Date.now() - cached.at < TTL) return cached.media;

  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const url =
    `https://www.googleapis.com/drive/v3/files?q=${q}&key=${key}` +
    `&fields=files(id,name,mimeType)&orderBy=name&pageSize=1000`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      cache.set(folderId, { at: Date.now(), media: empty });
      return empty;
    }
    const data = await res.json();
    const files: { id: string; mimeType: string }[] = data.files || [];
    const media: FolderMedia = {
      imageIds: files.filter((f) => f.mimeType?.startsWith('image/')).map((f) => f.id),
      videoIds: files.filter((f) => f.mimeType?.startsWith('video/')).map((f) => f.id),
    };
    cache.set(folderId, { at: Date.now(), media });
    return media;
  } catch {
    return empty;
  }
}
