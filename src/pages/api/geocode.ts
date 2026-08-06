import type { APIRoute } from 'astro';

export const prerender = false;

const headers = { 'Content-Type': 'application/json' };

export const GET: APIRoute = async ({ url, request }) => {
  const query = (url.searchParams.get('q') || '').trim().slice(0, 100);
  if (query.length < 2) {
    return new Response(JSON.stringify({ error: 'Enter a city and country' }), { status: 400, headers });
  }

  const origin = request.headers.get('origin');
  if (origin && !['https://lovefarfox.com', 'http://localhost:4321'].includes(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403, headers });
  }

  const endpoint = new URL('https://nominatim.openstreetmap.org/search');
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('format', 'jsonv2');
  endpoint.searchParams.set('limit', '1');
  endpoint.searchParams.set('addressdetails', '1');

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'FarFox/1.0 (blake@lovefarfox.com)',
      },
    });
    if (!response.ok) throw new Error(`geocoder returned ${response.status}`);
    const [match] = await response.json();
    if (!match) {
      return new Response(JSON.stringify({ error: 'Location not found' }), { status: 404, headers });
    }
    return new Response(JSON.stringify({
      label: match.display_name,
      lat: Number(match.lat),
      lon: Number(match.lon),
    }), {
      headers: {
        ...headers,
        'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000',
      },
    });
  } catch (error) {
    console.error('geocode failed', String(error));
    return new Response(JSON.stringify({ error: 'Location search is temporarily unavailable' }), { status: 502, headers });
  }
};
