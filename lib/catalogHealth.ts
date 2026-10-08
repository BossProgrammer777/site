// ---------------------------------------------------------------------------
// Проверка прайса: изменения у поставщика, которые ломают сайт (пропали бренды,
// массово сменились названия → адреса, дубли кодов, опустевшие разделы…).
//  - catalogHealth(c)        — состояние каталога «здесь и сейчас» (утренний отчёт);
//  - catalogDiff(prev, next) — что резко изменилось с прошлого чтения прайса.
// Только чтение: каталог не меняется. Тексты — HTML для Telegram, по-украински.
// ---------------------------------------------------------------------------

import type { Catalog, Product, Section } from './types';
import { BRAND_LANDINGS, detectBrand, isNoBrandLine } from './brand';

export interface HealthIssue {
  /** Стабильный ключ — чтобы не слать одно и то же повторно. */
  key: string;
  level: 'critical' | 'warn';
  text: string;
  /** Полный список (для файла-вложения), если в тексте показаны не все строки. */
  full?: { title: string; lines: string[] };
}

// Разделы, где бренд обязателен (фильтр «Бренд» и бренд-страницы).
const BRANDED = new Set(['butsy', 'sorokonizhky', 'futzalky', 'dytiache-vzuttia']);
const NO_BRAND_SHARE = 0.2; // > 20% товаров раздела без бренда — тревога
const DROP_SHARE = 0.7; // раздел уменьшился больше чем на 30%

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function examples(list: string[], n = 5): string {
  const shown = list.slice(0, n).map((x) => `• ${esc(x)}`);
  if (list.length > n) shown.push(`… і ще ${list.length - n}`);
  return shown.join('\n');
}

const brandOf = (p: Product, s: Section) => detectBrand(`${p.group || ''} ${p.name}`, s.slug);

/** Проблемы каталога в текущем виде. */
export function catalogHealth(c: Catalog): HealthIssue[] {
  const out: HealthIssue[] = [];

  if (c.source !== 'live') {
    out.push({
      key: 'source',
      level: 'critical',
      text: '🔴 <b>Сайт не читає прайс</b> — показує демо-дані. Перевірте доступ до Google Таблиці.',
    });
    return out;
  }

  for (const s of c.sections) {
    // Раздел пустой — обычно поставщик переименовал лист или колонки.
    if (!s.products.length) {
      out.push({
        key: `empty:${s.slug}`,
        level: 'critical',
        text: `🔴 <b>Розділ «${esc(s.label)}» порожній</b> — у прайсі не знайдено жодного товару. Можливо, змінили назву листа або колонок.`,
      });
      continue;
    }
    // Товары без бренда в брендовых разделах (кроме безбрендовых линеек Tezaz).
    if (BRANDED.has(s.slug) && s.products.length >= 5) {
      const noBrand = s.products.filter((p) => !brandOf(p, s) && !isNoBrandLine(`${p.group || ''} ${p.name}`));
      if (noBrand.length >= 3 && noBrand.length / s.products.length > NO_BRAND_SHARE) {
        out.push({
          key: `brand:${s.slug}`,
          level: 'warn',
          text:
            `🟠 <b>«${esc(s.label)}»: ${noBrand.length} з ${s.products.length} товарів без бренду</b>\n` +
            `Сайт не впізнав бренд за назвою — ці товари не потрапляють у фільтр «Бренд» і на сторінки Nike/Adidas:\n` +
            examples(noBrand.map((p) => p.name)),
          full: { title: `«${s.label}»: товари без бренду (${noBrand.length})`, lines: noBrand.map((p) => `${p.code}: ${p.name}`) },
        });
      }
    }
  }

  // Одинаковые коды у разных товаров — ломают редирект со старых адресов и заказы в CRM.
  const byCode = new Map<string, { name: string; label: string; slug: string }[]>();
  for (const s of c.sections)
    for (const p of s.products) {
      const code = (p.code || '').trim();
      if (!code) continue;
      const list = byCode.get(code) || [];
      list.push({ name: p.name, label: s.label, slug: p.slug });
      byCode.set(code, list);
    }
  const dups = Array.from(byCode.entries())
    .filter(([, list]) => list.length > 1)
    .sort(([a], [b]) => a.localeCompare(b, 'uk', { numeric: true }));
  if (dups.length) {
    const line = ([code, list]: [string, { name: string; label: string; slug: string }[]]) => {
      // Одинаковый адрес (одинаковые название и код в разных листах) — один товар перекрывает другой.
      const sameUrl = new Set(list.map((x) => x.slug)).size < list.length;
      return `${code}: ${list.map((x) => `${x.name} (${x.label})`).join(' / ')}${sameUrl ? ' — ОДНАКОВА АДРЕСА' : ''}`;
    };
    const sameUrlCount = dups.filter(([, list]) => new Set(list.map((x) => x.slug)).size < list.length).length;
    out.push({
      key: `dup:${dups.map(([c]) => c).join(',')}`,
      level: 'warn',
      text:
        `🟠 <b>Однаковий код у різних товарів: ${dups.length}</b>` +
        (sameUrlCount ? ` (з них з однаковою адресою сторінки: ${sameUrlCount})` : '') +
        `\n` + examples(dups.map(line)),
      full: { title: `Однаковий код у різних товарів: ${dups.length}`, lines: dups.map(line) },
    });
  }

  // Товары без кода: их адрес зависит только от названия.
  const noCode = c.sections.flatMap((s) => s.products.filter((p) => !(p.code || '').trim()).map((p) => `${p.name} (${s.label})`));
  if (noCode.length) {
    out.push({
      key: `nocode:${noCode.length}`,
      level: 'warn',
      text: `🟠 <b>Товари без коду: ${noCode.length}</b>\nПри зміні назви в них зміниться адреса без редиректу:\n` + examples(noCode),
      full: { title: `Товари без коду: ${noCode.length}`, lines: noCode },
    });
  }

  return out;
}

/** Резкие изменения между двумя чтениями прайса (только live → live). */
export function catalogDiff(prev: Catalog | null, next: Catalog): HealthIssue[] {
  if (!prev || prev.source !== 'live' || next.source !== 'live') return [];
  const out: HealthIssue[] = [];
  const prevSec = new Map(prev.sections.map((s) => [s.slug, s]));

  for (const s of next.sections) {
    const before = prevSec.get(s.slug);
    if (!before) continue;

    // Раздел резко уменьшился.
    if (before.products.length >= 10 && s.products.length < before.products.length * DROP_SHARE) {
      out.push({
        key: `drop:${s.slug}:${s.products.length}`,
        level: 'critical',
        text: `🔴 <b>«${esc(s.label)}»: було ${before.products.length} товарів → стало ${s.products.length}</b>\nЙмовірно, змінилась структура прайсу (лист, колонки) або товари видалили.`,
      });
    }

    // Пропал бренд, у которого есть страница (/catalog/<раздел>/<бренд> станет 404).
    for (const b of BRAND_LANDINGS) {
      const had = before.products.filter((p) => brandOf(p, before) === b.name).length;
      const has = s.products.filter((p) => brandOf(p, s) === b.name).length;
      if (had > 0 && has === 0) {
        out.push({
          key: `landing:${s.slug}:${b.slug}`,
          level: 'critical',
          text: `🔴 <b>Сторінка /catalog/${s.slug}/${b.slug} зникне</b> — у «${esc(s.label)}» більше немає товарів ${esc(b.name)} (було ${had}). Можливо, з назв прибрали бренд.`,
        });
      }
    }
  }

  // Переименования (по всем разделам): тот же код, другое название → другой адрес.
  const renamed: { code: string; text: string }[] = [];
  for (const s of next.sections) {
    const before = prevSec.get(s.slug);
    if (!before) continue;
    const oldByCode = new Map(before.products.filter((p) => p.code).map((p) => [p.code.trim(), p]));
    for (const p of s.products) {
      const old = p.code ? oldByCode.get(p.code.trim()) : undefined;
      if (old && old.slug !== p.slug && old.name !== p.name)
        renamed.push({ code: p.code.trim(), text: `${p.code.trim()}: «${old.name}» → «${p.name}» (${s.label})` });
    }
  }
  if (renamed.length) {
    out.push({
      key: `rename:${renamed.map((r) => r.code).sort().join(',')}`,
      level: 'warn',
      text:
        `🟠 <b>Змінено назву ${renamed.length} товар(ів)</b> → змінилась адреса сторінки (старі адреси ведуть на нові через редирект). Якщо назви змінили не ви — перевірте прайс:\n` +
        examples(renamed.map((r) => r.text)),
      full: { title: `Змінено назву: ${renamed.length}`, lines: renamed.map((r) => r.text) },
    });
  }
  return out;
}

/** Готовое сообщение для Telegram (≤ 4000 символов). */
export function healthMessage(title: string, issues: HealthIssue[]): string {
  const body = issues
    .slice()
    .sort((a, b) => (a.level === b.level ? 0 : a.level === 'critical' ? -1 : 1))
    .map((i) => i.text)
    .join('\n\n');
  const msg = `<b>${esc(title)}</b>\n\n${body}`;
  return msg.length > 4000 ? `${msg.slice(0, 3990)}…` : msg;
}

/** Текст файла с полными списками (если в сообщении показаны не все строки). */
export function healthFullText(title: string, issues: HealthIssue[]): string | null {
  const big = issues.filter((i) => i.full && i.full.lines.length > 5);
  if (!big.length) return null;
  const date = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
  return [
    `${title} — ${date}`,
    '',
    ...big.flatMap((i) => [i.full!.title, ...i.full!.lines.map((l) => `  • ${l}`), '']),
  ].join('\n');
}
