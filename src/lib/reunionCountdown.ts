export type Reunion = { you: string; partner: string; date: string; zone: string };
export const cleanName = (value: string) => [...value.replace(/[\u0000-\u001f\u007f]/g, '').trim()].slice(0, 32).join('');
export function validDate(value: string): boolean {
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function validZone(zone: string): boolean {
  try { new Intl.DateTimeFormat('en', { timeZone: zone }).format(); return zone.length > 0 && zone.length < 100; } catch { return false; }
}
export function calendarDate(now: Date, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function daysUntil(date: string, zone: string, now = new Date()): number {
  if (!validDate(date) || !validZone(zone)) throw new Error('Invalid reunion date or time zone');
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${calendarDate(now, zone)}T00:00:00Z`)) / 86400000);
}
export function reunionUrl(origin: string, reunion: Reunion): string {
  if (!validDate(reunion.date) || !validZone(reunion.zone)) throw new Error('Invalid countdown');
  const url = new URL('/reunion-countdown/', origin);
  url.search = new URLSearchParams({ utm_source: 'partner_share', utm_medium: 'referral', utm_campaign: 'reunion_countdown' }).toString();
  url.hash = new URLSearchParams({ v: '1', you: cleanName(reunion.you), partner: cleanName(reunion.partner), date: reunion.date, zone: reunion.zone }).toString();
  return url.href;
}
export function readReunion(hash: string): Reunion | null {
  if (hash.length > 2000) return null;
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const date = p.get('date') || '', zone = p.get('zone') || '';
  if (p.get('v') !== '1' || !validDate(date) || !validZone(zone)) return null;
  return { you: cleanName(p.get('you') || ''), partner: cleanName(p.get('partner') || ''), date, zone };
}
export function reunionHeading(r: Reunion): string {
  return [r.you, r.partner].filter(Boolean).join(' & ') || 'You & me';
}
export function reunionLabel(days: number): string {
  return days < 0 ? 'A reunion to remember' : days === 0 ? 'Today is your reunion day' : days === 1 ? '1 day until we’re together' : `${days} days until we’re together`;
}

/** The countdown as a small widget other sites can frame; the hash keeps names out of server logs, as on the tool. */
export function embedUrl(origin: string, reunion: Reunion): string {
  const url = new URL(reunionUrl(origin, reunion));
  url.pathname = '/embed/countdown/';
  url.search = '';
  return url.href;
}

export const EMBED_SIZE = { width: 320, height: 400 };
const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
/** The snippet couples paste into a blog, Notion or Tumblr: the iframe, plus a plain link on the host page. */
export function embedCode(origin: string, reunion: Reunion): string {
  const tool = new URL('/reunion-countdown/', origin).href;
  return `<iframe src="${attr(embedUrl(origin, reunion))}" width="${EMBED_SIZE.width}" height="${EMBED_SIZE.height}" style="border:0;border-radius:24px;max-width:100%" title="${attr(reunionHeading(reunion))} reunion countdown" loading="lazy"></iframe>\n<p style="font:13px/1.4 sans-serif;margin:6px 0 0"><a href="${tool}">Long-distance reunion countdown</a> by Far Fox</p>`;
}
