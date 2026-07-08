export const PLACEHOLDER = '/placeholder.svg';

// Источник картинки товара: data/локальные — как есть, http — через прокси,
// иначе плейсхолдер.
export function productImageSrc(image: string | null): string {
  if (!image) return PLACEHOLDER;
  if (image.startsWith('data:') || image.startsWith('/')) return image;
  if (image.startsWith('http')) return `/api/img?src=${encodeURIComponent(image)}`;
  return PLACEHOLDER;
}
