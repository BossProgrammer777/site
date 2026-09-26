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
  /** false — Drive API ответил ошибкой: пустой список НЕ означает «в папке пусто». */
  ok: boolean;
}

const cache = new Map<string, { at: number; media: FolderMedia }>();
const TTL = 30 * 60 * 1000; // 30 мин

export async function listFolderMedia(folderId: string): Promise<FolderMedia> {
  const empty: FolderMedia = { imageIds: [], videoIds: [], ok: true };
  const failed: FolderMedia = { imageIds: [], videoIds: [], ok: false };
  const key = process.env.GOOGLE_API_KEY || process.env.GOOGLE_SHEETS_API_KEY;
  if (!folderId) return empty;
  if (!key) {
    console.error('[drive] нет GOOGLE_API_KEY — галерея пустая');
    return failed;
  }

  const cached = cache.get(folderId);
  if (cached && Date.now() - cached.at < TTL) return cached.media;

  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const url =
    `https://www.googleapis.com/drive/v3/files?q=${q}&key=${key}` +
    `&fields=files(id,name,mimeType)&orderBy=name&pageSize=1000`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      // Ошибку НЕ кэшируем: иначе один сбой/лимит Drive на 30 мин (а через CDN —
      // до суток) оставлял карточки без живых фото. Причину пишем в логи Vercel.
      const body = await res.text().catch(() => '');
      console.error(`[drive] files.list ${res.status} folder=${folderId}: ${body.slice(0, 300)}`);
      return failed;
    }
    const data = await res.json();
    const files: { id: string; mimeType: string }[] = data.files || [];
    const media: FolderMedia = {
      imageIds: files.filter((f) => f.mimeType?.startsWith('image/')).map((f) => f.id),
      videoIds: files.filter((f) => f.mimeType?.startsWith('video/')).map((f) => f.id),
      ok: true,
    };
    cache.set(folderId, { at: Date.now(), media });
    return media;
  } catch (e) {
    console.error(`[drive] files.list сеть folder=${folderId}: ${(e as Error).message}`);
    return failed;
  }
}
