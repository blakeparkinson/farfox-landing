import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { IDEA_PICKERS, extractIdeas, categoriesOf, ideaInviteUrl, readIdeaInvite, nextStepFor } from '../src/lib/postIdeas.ts';

const body = (id) => readFileSync(new URL(`../src/content/blog/${id}.md`, import.meta.url), 'utf8').replace(/^---[\s\S]*?---/, '');

// Each picker deals exactly the ideas its post lists, every one under a category, none in markdown.
const EXPECTED = { 'couple-challenge-ideas': 50, 'long-distance-relationship-questions': 100, 'long-distance-relationship-activities': 25, 'long-distance-date-ideas': 47 };
for (const [id, count] of Object.entries(EXPECTED)) {
  const ideas = extractIdeas(body(id));
  assert.equal(ideas.length, count, `${id} lists ${count} ideas`);
  for (const idea of ideas) {
    assert.ok(idea.category && idea.title, `${id}: every idea has a category and a title`);
    assert.doesNotMatch(idea.title + idea.text, /\*\*|\]\(|`/, `${id}: no markdown leaks into "${idea.title}"`);
  }
  assert.ok(categoriesOf(ideas).length >= 4, `${id} has categories to filter by`);
}
for (const id of Object.keys(IDEA_PICKERS)) assert.ok(extractIdeas(body(id)).length >= 20, `${id} has enough ideas for a picker`);

// A bold item's description is the paragraph under it.
assert.deepEqual(extractIdeas('## Daily\n\n**1. The gratitude text**\nText one thing you are grateful for.\n\n**2. [Mood](/x) check-in**\nShare a mood.'), [
  { category: 'Daily', title: 'The gratitude text', text: 'Text one thing you are grateful for.' },
  { category: 'Daily', title: 'Mood check-in', text: 'Share a mood.' },
]);
assert.deepEqual(extractIdeas('Intro 1. not an idea\n\n1. Before any section'), [], 'ideas need a section heading');

// A partner link opens the picker on the same idea, and nothing else does.
const url = new URL(ideaInviteUrl('https://lovefarfox.com', 'couple-challenge-ideas', 7));
assert.equal(url.pathname, '/blog/couple-challenge-ideas/');
assert.equal(readIdeaInvite(url.hash, 50), 7);
assert.equal(readIdeaInvite('#idea=50', 50), null, 'out of range');
assert.equal(readIdeaInvite('#other', 50), null);

// Posts with their own tool skip the next-step card; the rest point to the tool that fits them.
assert.equal(nextStepFor('couple-challenge-ideas'), null);
assert.equal(nextStepFor('long-distance-relationship-games'), null);
assert.equal(nextStepFor('long-distance-relationship-time-zones').href, '/long-distance-time-zone-calculator/');
assert.equal(nextStepFor('long-distance-reunion-checklist').href, '/reunion-countdown/');
assert.equal(nextStepFor('long-distance-relationship-statistics').href, '/long-distance-relationship-quiz/');
assert.equal(nextStepFor('long-distance-relationship-nicknames').href, '/quiz/');

console.log('post ideas: all checks passed');
