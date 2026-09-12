export const GAME_ID = 'reunion-v1';
export const GAME_CHOICES = ['Stay in, order food, phones off', 'Go out, dress up, make a night of it'] as const;
export function readInvitation(hash: string): number | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const choice = params.get('pick');
  return params.get('game') === GAME_ID && (choice === '0' || choice === '1') ? Number(choice) : null;
}
export function invitationUrl(origin: string, choice: number): string {
  if (choice !== 0 && choice !== 1) throw new Error('Invalid game choice');
  const url = new URL('/', origin);
  url.searchParams.set('utm_source', 'partner_share');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', 'reunion_game');
  url.hash = new URLSearchParams({ game: GAME_ID, pick: String(choice) }).toString();
  return url.href;
}
