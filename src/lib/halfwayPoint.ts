import { MEETING_HUBS, type MeetingHub } from './meetingHubs.ts';

export type Place = { label: string; lat: number; lon: number };
export type HubOption = MeetingHub & { fromKm: number; toKm: number };

const EARTH_RADIUS_KM = 6371.0088;
const radians = (degrees: number) => degrees * Math.PI / 180;

export function validPoint(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const latitudeDelta = radians(b.lat - a.lat);
  const longitudeDelta = radians(b.lon - a.lon);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(longitudeDelta / 2) ** 2;
  const clamped = Math.min(1, Math.max(0, haversine));
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped));
}

export function midpoint(a: { lat: number; lon: number }, b: { lat: number; lon: number }): { lat: number; lon: number } {
  const phi1 = radians(a.lat);
  const phi2 = radians(b.lat);
  const lambda1 = radians(a.lon);
  const deltaLambda = radians(b.lon - a.lon);
  const bx = Math.cos(phi2) * Math.cos(deltaLambda);
  const by = Math.cos(phi2) * Math.sin(deltaLambda);
  const phiM = Math.atan2(
    Math.sin(phi1) + Math.sin(phi2),
    Math.sqrt((Math.cos(phi1) + bx) ** 2 + by ** 2),
  );
  const lambdaM = lambda1 + Math.atan2(by, Math.cos(phi1) + bx);
  const lon = ((lambdaM * 180 / Math.PI + 540) % 360) - 180;
  return { lat: phiM * 180 / Math.PI, lon };
}

export function fairestHubs(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
  hubs: MeetingHub[] = MEETING_HUBS,
  limit = 3,
): HubOption[] {
  const total = distanceKm(a, b);
  return hubs
    .map(hub => ({ ...hub, fromKm: distanceKm(a, hub), toKm: distanceKm(b, hub) }))
    .filter(hub => Math.max(hub.fromKm, hub.toKm) < 0.9 * total)
    .sort((left, right) => Math.max(left.fromKm, left.toKm) - Math.max(right.fromKm, right.toKm)
      || Math.abs(left.fromKm - left.toKm) - Math.abs(right.fromKm - right.toKm))
    .slice(0, Math.max(0, limit));
}

export function formatDistance(km: number): string {
  const format = (distance: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(distance));
  return `${format(km)} km (${format(km * 0.621371)} mi)`;
}

export const cleanLabel = (value: string) => [...value.replace(/[\u0000-\u001f\u007f]/g, '').trim()].slice(0, 60).join('');

export function halfwayUrl(origin: string, a: Place, b: Place): string {
  if (!validPoint(a.lat, a.lon) || !validPoint(b.lat, b.lon)) throw new Error('Invalid halfway point');
  const url = new URL('/halfway-point-calculator/', origin);
  url.search = new URLSearchParams({
    utm_source: 'partner_share',
    utm_medium: 'referral',
    utm_campaign: 'halfway_point',
  }).toString();
  const rounded = (value: number) => String(Math.round(value * 100) / 100);
  url.hash = new URLSearchParams({
    v: '1',
    a: cleanLabel(a.label),
    alat: rounded(a.lat),
    alon: rounded(a.lon),
    b: cleanLabel(b.label),
    blat: rounded(b.lat),
    blon: rounded(b.lon),
  }).toString();
  return url.href;
}

export function readHalfway(hash: string): { a: Place; b: Place } | null {
  if (hash.length > 2000) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (params.get('v') !== '1') return null;
  const labelA = cleanLabel(params.get('a') || '');
  const labelB = cleanLabel(params.get('b') || '');
  const latA = params.get('alat');
  const lonA = params.get('alon');
  const latB = params.get('blat');
  const lonB = params.get('blon');
  if (!labelA || !labelB || !latA?.trim() || !lonA?.trim() || !latB?.trim() || !lonB?.trim()) return null;
  const a = { label: labelA, lat: Number(latA), lon: Number(lonA) };
  const b = { label: labelB, lat: Number(latB), lon: Number(lonB) };
  if (!validPoint(a.lat, a.lon) || !validPoint(b.lat, b.lon)) return null;
  return { a, b };
}
