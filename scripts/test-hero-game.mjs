import assert from 'node:assert/strict';
import { GAME_ID, GAME_CHOICES, invitationUrl, readInvitation } from '../src/lib/heroGame.ts';
for (const choice of [0, 1]) {
  const url = new URL(invitationUrl('https://lovefarfox.com', choice));
  assert.equal(readInvitation(url.hash), choice);
  assert.equal(url.pathname, '/');
  assert.equal(url.searchParams.get('utm_campaign'), 'reunion_game');
  assert.equal(url.searchParams.has('pick'), false, 'Answer stays out of the server query');
  assert.ok(GAME_CHOICES[choice]);
}
for (const hash of ['', '#pick=0', '#game=old&pick=1', `#game=${GAME_ID}&pick=-1`, `#game=${GAME_ID}&pick=2`, `#game=${GAME_ID}&pick=`, `#game=${GAME_ID}&pick=<script>`]) {
  assert.equal(readInvitation(hash), null);
}
assert.throws(() => invitationUrl('https://lovefarfox.com', 2));
console.log('Hero invitation round trips and invalid-link fallbacks passed.');
