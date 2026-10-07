// City-pair guides for long-distance couples: one page per real route (/long-distance/<a>-to-<b>/),
// with the numbers couples search for: time difference, the hours both are awake, distance, and where to
// meet halfway. Everything is computed from coordinates and IANA zones, so DST is always right.
import { distanceKm, fairestHubs } from './halfwayPoint.ts';

export interface RouteCity { slug: string; city: string; country: string; lat: number; lon: number; tz: string }

const c = (city: string, country: string, lat: number, lon: number, tz: string): RouteCity =>
  ({ slug: city.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), city, country, lat, lon, tz });

export const ROUTE_CITIES: RouteCity[] = [
  c('New York', 'United States', 40.71, -74.01, 'America/New_York'), c('Los Angeles', 'United States', 34.05, -118.24, 'America/Los_Angeles'),
  c('Chicago', 'United States', 41.88, -87.63, 'America/Chicago'), c('Houston', 'United States', 29.76, -95.37, 'America/Chicago'),
  c('Dallas', 'United States', 32.78, -96.8, 'America/Chicago'), c('Miami', 'United States', 25.76, -80.19, 'America/New_York'),
  c('Atlanta', 'United States', 33.75, -84.39, 'America/New_York'), c('Seattle', 'United States', 47.61, -122.33, 'America/Los_Angeles'),
  c('San Francisco', 'United States', 37.77, -122.42, 'America/Los_Angeles'), c('Boston', 'United States', 42.36, -71.06, 'America/New_York'),
  c('Denver', 'United States', 39.74, -104.99, 'America/Denver'), c('Phoenix', 'United States', 33.45, -112.07, 'America/Phoenix'),
  c('Toronto', 'Canada', 43.65, -79.38, 'America/Toronto'), c('Vancouver', 'Canada', 49.28, -123.12, 'America/Vancouver'),
  c('London', 'United Kingdom', 51.51, -0.13, 'Europe/London'), c('Manchester', 'United Kingdom', 53.48, -2.24, 'Europe/London'),
  c('Dublin', 'Ireland', 53.35, -6.26, 'Europe/Dublin'), c('Paris', 'France', 48.86, 2.35, 'Europe/Paris'),
  c('Berlin', 'Germany', 52.52, 13.4, 'Europe/Berlin'), c('Amsterdam', 'Netherlands', 52.37, 4.9, 'Europe/Amsterdam'),
  c('Madrid', 'Spain', 40.42, -3.7, 'Europe/Madrid'), c('Rome', 'Italy', 41.9, 12.5, 'Europe/Rome'),
  c('Mumbai', 'India', 19.08, 72.88, 'Asia/Kolkata'), c('Delhi', 'India', 28.61, 77.21, 'Asia/Kolkata'),
  c('Bangalore', 'India', 12.97, 77.59, 'Asia/Kolkata'), c('Hyderabad', 'India', 17.39, 78.49, 'Asia/Kolkata'),
  c('Chennai', 'India', 13.08, 80.27, 'Asia/Kolkata'), c('Manila', 'Philippines', 14.6, 120.98, 'Asia/Manila'),
  c('Cebu', 'Philippines', 10.32, 123.89, 'Asia/Manila'), c('Karachi', 'Pakistan', 24.86, 67.0, 'Asia/Karachi'),
  c('Lahore', 'Pakistan', 31.55, 74.34, 'Asia/Karachi'), c('Singapore', 'Singapore', 1.35, 103.82, 'Asia/Singapore'),
  c('Tokyo', 'Japan', 35.68, 139.69, 'Asia/Tokyo'), c('Seoul', 'South Korea', 37.57, 126.98, 'Asia/Seoul'),
  c('Sydney', 'Australia', -33.87, 151.21, 'Australia/Sydney'), c('Melbourne', 'Australia', -37.81, 144.96, 'Australia/Melbourne'),
  c('Auckland', 'New Zealand', -36.85, 174.76, 'Pacific/Auckland'), c('Dubai', 'United Arab Emirates', 25.2, 55.27, 'Asia/Dubai'),
  c('Lagos', 'Nigeria', 6.52, 3.38, 'Africa/Lagos'), c('Johannesburg', 'South Africa', -26.2, 28.05, 'Africa/Johannesburg'),
  c('Mexico City', 'Mexico', 19.43, -99.13, 'America/Mexico_City'), c('São Paulo', 'Brazil', -23.55, -46.63, 'America/Sao_Paulo'),
];
const byCountry = (...countries: string[]) => ROUTE_CITIES.filter((x) => countries.includes(x.country));
const named = (...cities: string[]) => ROUTE_CITIES.filter((x) => cities.includes(x.city));

// Corridors long-distance couples actually live on: [home side, far side]. The home side is named first in the URL.
const US_HUBS = named('New York', 'Los Angeles', 'Chicago', 'Houston', 'Dallas', 'Miami', 'Seattle', 'San Francisco');
const WORLD = ROUTE_CITIES.filter((x) => !['United States', 'Canada'].includes(x.country));
const CORRIDORS: [RouteCity[], RouteCity[]][] = [
  [US_HUBS, [...WORLD, ...byCountry('Canada')]],
  [named('New York', 'Boston', 'Miami', 'Atlanta', 'Chicago'), named('Los Angeles', 'San Francisco', 'Seattle', 'Denver', 'Phoenix')],
  [byCountry('United Kingdom'), byCountry('India', 'Philippines', 'Australia', 'New Zealand', 'Canada', 'Pakistan', 'Singapore', 'United Arab Emirates', 'Nigeria', 'South Africa', 'Japan', 'South Korea')],
  [byCountry('Canada'), byCountry('India', 'Philippines', 'Australia', 'Pakistan', 'Germany', 'France', 'Ireland')],
  [byCountry('Australia'), byCountry('India', 'Philippines', 'New Zealand', 'Singapore', 'Japan', 'Germany', 'France', 'Ireland')],
  [named('Mumbai', 'Delhi', 'Bangalore'), byCountry('Germany', 'France', 'Netherlands', 'Singapore', 'United Arab Emirates')],
  [named('Manila'), byCountry('Japan', 'South Korea', 'Singapore', 'United Arab Emirates')],
];
// Shorter than this, a pair is a weekend drive rather than a long-distance relationship guide.
const MIN_ROUTE_KM = 700;

export interface Route { slug: string; a: RouteCity; b: RouteCity; km: number }
export const ROUTES: Route[] = (() => {
  const seen = new Set<string>(), routes: Route[] = [];
  for (const [home, far] of CORRIDORS) for (const a of home) for (const b of far) {
    const key = [a.slug, b.slug].sort().join('|'), km = distanceKm(a, b);
    if (a.slug === b.slug || seen.has(key) || km < MIN_ROUTE_KM) continue;
    seen.add(key);
    routes.push({ slug: `${a.slug}-to-${b.slug}`, a, b, km });
  }
  return routes;
})();

/** Minutes east of UTC for a zone at a moment, from the platform's own zone data. */
export function offsetMinutes(tz: string, at: Date): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(at).find((p) => p.type === 'timeZoneName')?.value || 'GMT';
  const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0)) : 0;
}

/** How far b is ahead of a, in minutes, at a moment. */
export const gapMinutes = (a: RouteCity, b: RouteCity, at: Date) => offsetMinutes(b.tz, at) - offsetMinutes(a.tz, at);

export const hoursLabel = (minutes: number) => { const h = Math.abs(minutes) / 60; return `${Number.isInteger(h) ? h : h.toFixed(1)} hour${h === 1 ? '' : 's'}`; };
/** "London is 5 hours ahead of New York", "Los Angeles is 3 hours behind New York". */
export function gapSentence(from: RouteCity, to: RouteCity, minutes: number): string {
  return minutes === 0 ? `${to.city} and ${from.city} are on the same time` : `${to.city} is ${hoursLabel(minutes)} ${minutes > 0 ? 'ahead of' : 'behind'} ${from.city}`;
}

// A day both people are realistically free to talk: awake from 8am to 11pm local.
export const AWAKE = { from: 8 * 60, to: 23 * 60 };
const SLOT = 30;
export interface Window { aFrom: number; aTo: number; bFrom: number; bTo: number }
/** The stretches, in each city's local time, when both are awake. */
export function awakeWindows(gap: number): Window[] {
  const both = (t: number) => { const bt = (((t + gap) % 1440) + 1440) % 1440; return t >= AWAKE.from && t < AWAKE.to && bt >= AWAKE.from && bt < AWAKE.to; };
  const windows: Window[] = [];
  for (let t = 0; t < 1440; t += SLOT) {
    if (!both(t)) continue;
    const last = windows[windows.length - 1];
    if (last && last.aTo === t) last.aTo = t + SLOT; else windows.push({ aFrom: t, aTo: t + SLOT, bFrom: 0, bTo: 0 });
  }
  for (const w of windows) { w.bFrom = (((w.aFrom + gap) % 1440) + 1440) % 1440; w.bTo = (((w.aTo + gap) % 1440) + 1440) % 1440; }
  return windows;
}
export const windowMinutes = (windows: Window[]) => windows.reduce((sum, w) => sum + (w.aTo - w.aFrom), 0);

// The best call is in someone's evening: after work, before bed.
const EVENING = { from: 18 * 60, to: 22 * 60 }, CALL_MINUTES = 120;
const inEvening = (t: number) => { const m = ((t % 1440) + 1440) % 1440; return m >= EVENING.from && m < EVENING.to; };
/** The 2-hour stretch inside the shared hours that falls in the most evening time, for either of you. */
export function bestCall(windows: Window[], gap: number): Window | null {
  let best: Window | null = null, bestScore = -1;
  for (const w of windows) for (let t = w.aFrom; t + CALL_MINUTES <= w.aTo; t += SLOT) {
    let score = 0;
    for (let s = t; s < t + CALL_MINUTES; s += SLOT) score += Number(inEvening(s)) + Number(inEvening(s + gap));
    if (score > bestScore) { bestScore = score; best = { aFrom: t, aTo: t + CALL_MINUTES, bFrom: (((t + gap) % 1440) + 1440) % 1440, bTo: (((t + CALL_MINUTES + gap) % 1440) + 1440) % 1440 }; }
  }
  return best;
}
export function clock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440, h = Math.floor(m / 60), mm = m % 60;
  return `${h % 12 || 12}${mm ? `:${String(mm).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
}

// Average door-to-gate speed of a long-haul airliner plus taxi and climb, for a rough non-stop flight time.
const CRUISE_KMH = 800, GROUND_HOURS = 0.6;
export const flightHours = (km: number) => Math.round((km / CRUISE_KMH + GROUND_HOURS) * 2) / 2;

/** The gap on every day of a year: the usual gap, and any other gap with how many days it lasts. Pairs
 *  whose clocks change on different dates (US and UK, say) differ for a few weeks a year, even when
 *  January and July agree. */
export function yearOfGaps(a: RouteCity, b: RouteCity, year: number) {
  const days = new Map<number, number>();
  for (let d = 0; d < 365; d++) { const g = gapMinutes(a, b, new Date(Date.UTC(year, 0, 1 + d, 12))); days.set(g, (days.get(g) || 0) + 1); }
  const ranked = [...days.entries()].sort((x, y) => y[1] - x[1]);
  return { usual: ranked[0][0], others: ranked.slice(1).map(([gap, count]) => ({ gap, days: count })) };
}

export const halfwayHubs = (route: Route) => fairestHubs(route.a, route.b, undefined, 3);
export const routeBySlug = (slug: string) => ROUTES.find((r) => r.slug === slug);
/** Other routes from each of this route's cities, half and half, for internal links. */
export function relatedRoutes(route: Route, limit = 8): Route[] {
  // By slug, not identity: a page's route arrives as a copy of the one in ROUTES.
  const touching = (slug: string) => ROUTES.filter((r) => r.slug !== route.slug && (r.a.slug === slug || r.b.slug === slug));
  const fromA = touching(route.a.slug), fromB = touching(route.b.slug).filter((r) => !fromA.includes(r));
  const picked = [...fromA.slice(0, limit / 2), ...fromB.slice(0, limit / 2)];
  return [...picked, ...[...fromA, ...fromB].filter((r) => !picked.includes(r))].slice(0, limit);
}
