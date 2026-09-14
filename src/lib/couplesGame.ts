// Stable IDs and choices are part of shared links. Add questions; don't reorder choices.
export const QUESTIONS = [
  { id: 'reunion', prompt: 'Your first evening together: would you rather…', choices: ['Order takeout and stay in', 'Dress up and go out'] },
  { id: 'surprise', prompt: 'A surprise from your partner: would you rather get…', choices: ['A handwritten letter', 'A playlist with a note for each song'] },
  { id: 'weekend', prompt: 'A whole weekend together: would you rather…', choices: ['Book a cabin in the woods', 'Explore a city neither of you knows'] },
  { id: 'ordinary', prompt: 'One ordinary moment you could share: would you rather…', choices: ['Make breakfast together', 'Fall asleep next to each other'] },
  { id: 'date', prompt: 'Tonight’s video date: would you rather…', choices: ['Cook the same recipe', 'Play a ridiculous guessing game'] },
  { id: 'time', prompt: 'An extra hour together: would you rather…', choices: ['Take a walk with no destination', 'Stay on the couch and talk'] },
  { id: 'souvenir', prompt: 'Something to keep between visits: would you rather have…', choices: ['Their comfiest hoodie', 'A tiny album of your favorite photos'] },
  { id: 'future', prompt: 'A shared project: would you rather…', choices: ['Plan your dream trip', 'Design your future home'] },
] as const;
export type Pick = { id: string; choice: number };
export function validPick(pick: Pick): boolean {
  return QUESTIONS.some(q => q.id === pick.id) && (pick.choice === 0 || pick.choice === 1);
}
export function readGameInvite(hash: string): Pick | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const raw = params.get('pick');
  if (params.get('game') !== 'couples-v1' || (raw !== '0' && raw !== '1')) return null;
  const pick = { id: params.get('q') || '', choice: Number(raw) };
  return validPick(pick) ? pick : null;
}
export function gameInviteUrl(origin: string, pick: Pick): string {
  if (!validPick(pick)) throw new Error('Invalid question or choice');
  const url = new URL('/blog/long-distance-relationship-games/', origin);
  url.search = new URLSearchParams({ utm_source: 'partner_share', utm_medium: 'referral', utm_campaign: 'couples_wyr' }).toString();
  url.hash = new URLSearchParams({ game: 'couples-v1', q: pick.id, pick: String(pick.choice) }).toString();
  return url.href;
}
