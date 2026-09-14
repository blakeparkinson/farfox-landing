import assert from 'node:assert/strict';
import { QUESTIONS, readGameInvite, gameInviteUrl } from '../src/lib/couplesGame.ts';
assert.equal(new Set(QUESTIONS.map(q => q.id)).size, QUESTIONS.length);
for (const question of QUESTIONS) for (const choice of [0, 1]) {
  const pick = { id: question.id, choice };
  const url = new URL(gameInviteUrl('https://lovefarfox.com', pick));
  assert.deepEqual(readGameInvite(url.hash), pick);
  assert.equal(url.pathname, '/blog/long-distance-relationship-games/');
  assert.equal(url.searchParams.get('utm_campaign'), 'couples_wyr');
  assert.equal(url.searchParams.has('pick'), false);
  assert.equal(question.choices.length, 2);
}
for (const hash of ['', '#couples-game', '#game=old&q=reunion&pick=1', '#game=couples-v1&q=unknown&pick=0', '#game=couples-v1&q=reunion&pick=', '#game=couples-v1&q=reunion&pick=2', '#game=couples-v1&q=reunion&pick=<script>']) assert.equal(readGameInvite(hash), null);
for (const pick of [{id:'unknown',choice:0},{id:'reunion',choice:2},{id:'reunion',choice:NaN}]) assert.throws(() => gameInviteUrl('https://lovefarfox.com',pick));
console.log('Couples game: all 16 invitation round trips and invalid-link cases passed.');
