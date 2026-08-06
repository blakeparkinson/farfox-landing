import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compareRituals, RITUAL_QUESTIONS } from '../src/lib/connectionRituals.ts';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const allA = Object.fromEntries(RITUAL_QUESTIONS.map((question) => [question.key, question.choices[0].key]));
const allB = Object.fromEntries(RITUAL_QUESTIONS.map((question) => [question.key, question.choices[0].key]));
const allDifferent = Object.fromEntries(RITUAL_QUESTIONS.map((question) => [question.key, question.choices[1].key]));

const perfect = compareRituals(allA, allB);
assert.equal(perfect.matches, RITUAL_QUESTIONS.length);
assert.equal(perfect.percent, 100);
assert.ok(perfect.rows.every((row) => row.matches));

const different = compareRituals(allA, allDifferent);
assert.equal(different.matches, 0);
assert.equal(different.percent, 0);
assert.ok(different.rows.every((row) => !row.matches));

const quiz = read('src/pages/quiz.astro');
const profile = read('src/pages/profile/[slug].astro');
const match = read('src/pages/match/[left]/[right].astro');
const layout = read('src/layouts/Layout.astro');
const landing = read('src/pages/long-distance-relationship-app.astro');
const appGuide = read('src/content/blog/best-long-distance-relationship-apps.md');

assert.ok(quiz.includes("searchParams.get('partner_of')"), 'Quiz recognizes partner invitations');
assert.ok(quiz.includes('/match/${partnerOf}/${slug}?${resultParams}'), 'Second completion reveals the pair match');
assert.ok(quiz.includes("searchParams.get(`origin_${key}`)"), 'Original paid campaign survives the partner loop');
assert.ok(profile.includes("utm_campaign: 'love_profile_loop'"), 'Profile shares a tracked partner invitation');
assert.ok(profile.includes('inviteParams.set(`origin_${key}`'), 'Profile passes first-touch campaign context through the invitation');
assert.ok(profile.includes('partner_invite_shared'), 'Partner shares are measured');
assert.ok(match.includes('compareRituals'), 'Match page uses the tested overlap model');
assert.ok(match.includes('Start Far Fox together'), 'Match reveal drives the connected-couple action');
assert.ok(layout.includes('app_signup_clicked'), 'Every marketing-to-app handoff is measured globally');
assert.ok(layout.includes("destination.searchParams.set('landing_path'"), 'App receives landing attribution');
assert.ok(landing.includes('data-app-cta="search_hero"'), 'High-intent landing has a measurable primary CTA');
assert.ok(appGuide.includes('/long-distance-relationship-app?utm_source=organic_search'), 'High-intent SEO traffic enters the acquisition landing');

for (const event of [
  'quiz_started',
  'partner_quiz_landed',
  'partner_quiz_started',
  'partner_quiz_completed',
  'match_revealed',
  'app_signup_clicked',
]) {
  assert.ok(`${quiz}\n${profile}\n${match}\n${layout}`.includes(event), `${event} is instrumented`);
}

assert.ok(
  existsSync(resolve(root, 'dist/client/long-distance-relationship-app/index.html')),
  'Production build contains the paid-search acquisition page',
);

console.log('Partner referral, match reveal, attribution, and acquisition landing contracts passed.');
