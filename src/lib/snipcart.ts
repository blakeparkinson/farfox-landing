// Snipcart PUBLIC API key — safe to ship in client HTML (that's how the
// cart works). Env var wins if set in Vercel; otherwise this default.
export const SNIPCART_KEY: string = import.meta.env.PUBLIC_SNIPCART_KEY ?? 'ZDBhODA3ZGEtNzM5Zi00MGYxLTg4ODItOGY3NTYyMTQwNmRmNjM5MTYzNzE4NTA1NTczODE3';
export const cartLive = SNIPCART_KEY.length > 0;
