// ---------------------------------------------------------------------------
// Источник перехода клиента (first-touch). При первом заходе с внешнего
// источника (UTM-метка или referrer) сохраняем его в localStorage и потом
// прикладываем к заказу. Прямой/внутренний заход не фиксируем (останется «Пряме»).
// ---------------------------------------------------------------------------

const KEY = 'bb_attr';

function normalize(utm: string, ref: string): string {
  const s = (utm || '').toLowerCase();
  let host = '';
  try { host = ref ? new URL(ref).hostname.toLowerCase() : ''; } catch { host = (ref || '').toLowerCase(); }
  const hit = (...xs: string[]) => xs.some((x) => s.includes(x) || host.includes(x));
  if (hit('google')) return 'Google';
  if (hit('instagram', 'ig')) return 'Instagram';
  if (hit('tiktok')) return 'TikTok';
  if (hit('t.me', 'telegram', 'tgram')) return 'Telegram';
  if (hit('facebook', 'fb.com', 'fbclid', 'meta')) return 'Facebook';
  if (hit('youtube', 'youtu.be')) return 'YouTube';
  if (hit('bing')) return 'Bing';
  if (s) return utm; // прочий явный utm_source
  if (host) return host.replace(/^www\./, '');
  return 'Пряме';
}

export function captureFirstTouch(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(KEY)) return; // first-touch — не перезаписываем
    const p = new URLSearchParams(location.search);
    const utm = p.get('utm_source') || (p.get('gclid') ? 'google' : '') || (p.get('fbclid') ? 'facebook' : '');
    const ref = document.referrer || '';
    let refHost = '';
    try { refHost = ref ? new URL(ref).hostname : ''; } catch { refHost = ''; }
    // Прямой или внутренний переход — пока не фиксируем (ждём внешний источник).
    if (!utm && (!ref || refHost === location.hostname)) return;
    const source = normalize(utm, ref);
    const detail = utm ? `utm=${utm}` : ref;
    localStorage.setItem(KEY, JSON.stringify({ source, detail, at: Date.now() }));
  } catch { /* ignore */ }
}

export function getAttribution(): { src: string; srcDetail: string } {
  if (typeof window === 'undefined') return { src: '', srcDetail: '' };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const o = JSON.parse(raw); return { src: o.source || 'Пряме', srcDetail: o.detail || '' }; }
  } catch { /* ignore */ }
  return { src: 'Пряме', srcDetail: '' };
}
