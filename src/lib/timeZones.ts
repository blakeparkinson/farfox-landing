/** Common LDR city pairs. IANA zone names so DST is handled by the browser. */
export interface CityZone {
  city: string;
  region: string;
  tz: string;
}

export const CITIES: CityZone[] = [
  { city: 'New York', region: 'United States', tz: 'America/New_York' },
  { city: 'Los Angeles', region: 'United States', tz: 'America/Los_Angeles' },
  { city: 'Chicago', region: 'United States', tz: 'America/Chicago' },
  { city: 'Denver', region: 'United States', tz: 'America/Denver' },
  { city: 'Phoenix', region: 'United States', tz: 'America/Phoenix' },
  { city: 'Seattle', region: 'United States', tz: 'America/Los_Angeles' },
  { city: 'Miami', region: 'United States', tz: 'America/New_York' },
  { city: 'Dallas', region: 'United States', tz: 'America/Chicago' },
  { city: 'Atlanta', region: 'United States', tz: 'America/New_York' },
  { city: 'Boston', region: 'United States', tz: 'America/New_York' },
  { city: 'Honolulu', region: 'United States', tz: 'Pacific/Honolulu' },
  { city: 'Toronto', region: 'Canada', tz: 'America/Toronto' },
  { city: 'Vancouver', region: 'Canada', tz: 'America/Vancouver' },
  { city: 'Mexico City', region: 'Mexico', tz: 'America/Mexico_City' },
  { city: 'São Paulo', region: 'Brazil', tz: 'America/Sao_Paulo' },
  { city: 'Buenos Aires', region: 'Argentina', tz: 'America/Argentina/Buenos_Aires' },
  { city: 'London', region: 'United Kingdom', tz: 'Europe/London' },
  { city: 'Paris', region: 'France', tz: 'Europe/Paris' },
  { city: 'Berlin', region: 'Germany', tz: 'Europe/Berlin' },
  { city: 'Madrid', region: 'Spain', tz: 'Europe/Madrid' },
  { city: 'Rome', region: 'Italy', tz: 'Europe/Rome' },
  { city: 'Amsterdam', region: 'Netherlands', tz: 'Europe/Amsterdam' },
  { city: 'Stockholm', region: 'Sweden', tz: 'Europe/Stockholm' },
  { city: 'Dublin', region: 'Ireland', tz: 'Europe/Dublin' },
  { city: 'Lisbon', region: 'Portugal', tz: 'Europe/Lisbon' },
  { city: 'Moscow', region: 'Russia', tz: 'Europe/Moscow' },
  { city: 'Istanbul', region: 'Turkey', tz: 'Europe/Istanbul' },
  { city: 'Dubai', region: 'UAE', tz: 'Asia/Dubai' },
  { city: 'Mumbai', region: 'India', tz: 'Asia/Kolkata' },
  { city: 'Delhi', region: 'India', tz: 'Asia/Kolkata' },
  { city: 'Singapore', region: 'Singapore', tz: 'Asia/Singapore' },
  { city: 'Hong Kong', region: 'Hong Kong', tz: 'Asia/Hong_Kong' },
  { city: 'Tokyo', region: 'Japan', tz: 'Asia/Tokyo' },
  { city: 'Seoul', region: 'South Korea', tz: 'Asia/Seoul' },
  { city: 'Manila', region: 'Philippines', tz: 'Asia/Manila' },
  { city: 'Bangkok', region: 'Thailand', tz: 'Asia/Bangkok' },
  { city: 'Jakarta', region: 'Indonesia', tz: 'Asia/Jakarta' },
  { city: 'Shanghai', region: 'China', tz: 'Asia/Shanghai' },
  { city: 'Sydney', region: 'Australia', tz: 'Australia/Sydney' },
  { city: 'Melbourne', region: 'Australia', tz: 'Australia/Melbourne' },
  { city: 'Auckland', region: 'New Zealand', tz: 'Pacific/Auckland' },
  { city: 'Johannesburg', region: 'South Africa', tz: 'Africa/Johannesburg' },
  { city: 'Lagos', region: 'Nigeria', tz: 'Africa/Lagos' },
  { city: 'Cairo', region: 'Egypt', tz: 'Africa/Cairo' },
  { city: 'Nairobi', region: 'Kenya', tz: 'Africa/Nairobi' },
];

export const REGIONS = [...new Set(CITIES.map((c) => c.region))];
