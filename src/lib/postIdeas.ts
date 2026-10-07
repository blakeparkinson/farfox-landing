// Ideas read straight from a blog post's markdown, so the post and its interactive picker never drift:
// every numbered item a post lists (challenges, questions, dates, prompts) is a card the picker can deal.

export type Idea = { category: string; title: string; text: string };

/** Posts that get an idea picker above their content, with the words its buttons use. */
export const IDEA_PICKERS: Record<string, { heading: string; deal: string; noun: string }> = {
  'couple-challenge-ideas': { heading: 'Challenge spinner', deal: 'Give us a challenge', noun: 'challenge' },
  'long-distance-relationship-questions': { heading: 'Question deck', deal: 'Give us a question', noun: 'question' },
  'long-distance-relationship-activities': { heading: 'Something to do tonight', deal: 'Pick an activity', noun: 'activity' },
  'long-distance-date-ideas': { heading: 'Date night picker', deal: 'Pick our date', noun: 'date' },
  'love-letter-prompts-long-distance': { heading: 'Love letter prompt', deal: 'Give me a prompt', noun: 'prompt' },
};

const plain = (s: string) => s
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/[*_`]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const BOLD_ITEM = /^\*\*\d+\.\s+(.+?)\*\*\s*(.*)$/;
const NUMBERED_ITEM = /^\d+\.\s+(.+)$/;

/** Every numbered idea in the post, with the H2 it sits under as its category. */
export function extractIdeas(markdown: string): Idea[] {
  const lines = markdown.split('\n');
  const ideas: Idea[] = [];
  let category = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('## ')) { category = plain(line.slice(3)); continue; }
    if (!category) continue;
    const bold = BOLD_ITEM.exec(line);
    if (bold) {
      let text = plain(bold[2]);
      for (let j = i + 1; !text && j < lines.length && !lines[j].trim().startsWith('**') && !lines[j].trim().startsWith('#'); j++) text = plain(lines[j]);
      ideas.push({ category, title: plain(bold[1]), text });
      continue;
    }
    const numbered = NUMBERED_ITEM.exec(line);
    if (numbered) ideas.push({ category, title: plain(numbered[1]), text: '' });
  }
  return ideas;
}

export const categoriesOf = (ideas: Idea[]) => [...new Set(ideas.map((idea) => idea.category))];

/** A partner link opens the picker on the same idea; the hash keeps the canonical URL clean. */
export const ideaInviteUrl = (site: string, postId: string, index: number) => `${site}/blog/${postId}/#idea=${index}`;
export function readIdeaInvite(hash: string, count: number): number | null {
  const m = /idea=(\d+)/.exec(hash || '');
  const index = m ? Number(m[1]) : -1;
  return index >= 0 && index < count ? index : null;
}

/** The tool a post points its readers to next, placed partway through the post rather than at the end. */
export function nextStepFor(postId: string, tags: string[] = []) {
  const has = (re: RegExp) => re.test(postId) || tags.some((t) => re.test(t));
  if (IDEA_PICKERS[postId] || postId === 'long-distance-relationship-games') return null;
  if (has(/time-zone/)) return { href: '/long-distance-time-zone-calculator/', title: 'Find your best time to call', text: 'Enter both cities and see the hours you are both awake.', button: 'Open the time zone calculator' };
  if (has(/reunion|closing-the-distance|meeting|post-visit|visit/)) return { href: '/reunion-countdown/', title: 'Count down to your next reunion', text: 'Set the date and get a countdown you can share with them.', button: 'Start a reunion countdown' };
  if (has(/statistics|timeline|make-.*work|trust/)) return { href: '/long-distance-relationship-quiz/', title: 'How strong is your long-distance relationship?', text: 'A 2-minute quiz built on the research in this post.', button: 'Take the LDR quiz' };
  return { href: '/quiz/', title: 'Take the couple quiz together', text: 'Send it to your partner and see your love profiles side by side. Free, no signup.', button: 'Take the couple quiz' };
}
