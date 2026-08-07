/**
 * Competitor data for the /compare/* SEO pages. Keep claims factual and
 * verifiable from each app's public store listing or website — these pages
 * only work long-term if they stay honest.
 */

export interface Competitor {
  slug: string;
  name: string;
  tagline: string;
  /** What the competitor genuinely does well. */
  strengths: string[];
  /** Where Far Fox differs — framed as differences, not trash talk. */
  gaps: string[];
  /** One-line "pick them if" guidance. */
  pickThemIf: string;
  pickFarFoxIf: string;
  pricingNote: string;
  faqs: [string, string][];
}

export const FAR_FOX_FEATURES = [
  'Daily questions with both-answer reveal',
  'Love letters on themed stationery',
  'Private shared photo timeline',
  'Would You Rather & couple quizzes',
  'Challenges, streaks & XP',
  'Voice and video messages',
  'Time capsule letters',
  'AI companion (Ask Foxy)',
  'Shared calendar & visit countdowns',
  'Mood, presence & timezone view',
  'A shared fox that levels up together',
];

export const COMPETITORS: Competitor[] = [
  {
    slug: 'paired',
    name: 'Paired',
    tagline: 'Daily questions and quizzes backed by relationship research',
    strengths: [
      'Research-backed question packs and expert-written content',
      'Polished daily question flow with streaks',
      'Well-established brand with a large user base',
    ],
    gaps: [
      'Most content sits behind a subscription; Far Fox keeps core features free',
      'No shared photo timeline, voice messages, or letters — it centers on questions',
      'No playful progression like a shared companion that grows with you',
    ],
    pickThemIf: 'you mainly want expert-designed question packs and are happy to pay a subscription.',
    pickFarFoxIf: 'you want questions plus letters, photos, games, and countdowns in one free app.',
    pricingNote: 'Paired offers a limited free tier with a paid subscription for most packs. Far Fox core features are free.',
    faqs: [
      ['Is Far Fox a free alternative to Paired?', 'Yes. Far Fox keeps its core features — daily questions, love letters, shared photos, games, and countdowns — free, with no ads.'],
      ['Does Far Fox have daily couple questions like Paired?', 'Yes. Both partners answer separately and the answers reveal together once you have both responded.'],
    ],
  },
  {
    slug: 'couple',
    name: 'Couple',
    tagline: 'One of the original private couple apps: timeline, thumbkiss, chat',
    strengths: [
      'Simple, minimal private space that is easy to learn',
      'Thumbkiss is a genuinely sweet real-time touch feature',
      'Long track record in the category',
    ],
    gaps: [
      'Little active development in recent years',
      'No daily prompts, games, challenges, or AI features',
      'No sense of progression — nothing grows or changes as you use it',
    ],
    pickThemIf: 'you want the most minimal shared space possible and nothing else.',
    pickFarFoxIf: 'you want something to actually do together every day, not just a private chat.',
    pricingNote: 'Couple is free with a limited feature set. Far Fox core features are free.',
    faqs: [
      ['Is Far Fox similar to the Couple app?', 'Both give couples a private shared space, but Far Fox is built around daily rituals — questions, letters, challenges, and games — rather than messaging alone.'],
    ],
  },
  {
    slug: 'between',
    name: 'Between',
    tagline: 'A private messaging and photo archive app popular in Asia',
    strengths: [
      'Clean design with a strong shared photo and memory focus',
      'Anniversary and D-day tracking',
      'Solid private messaging layer',
    ],
    gaps: [
      'Free tier is limited; useful features require a subscription',
      'No daily questions, games, or interactive rituals',
      'Engagement centers on scrolling old memories rather than creating new ones daily',
    ],
    pickThemIf: 'your main goal is a private photo archive with messaging.',
    pickFarFoxIf: 'you want daily interaction — questions, letters, games — on top of shared photos.',
    pricingNote: 'Between locks several features behind Between Plus. Far Fox core features are free.',
    faqs: [
      ['Does Far Fox have a shared photo timeline like Between?', 'Yes — a private photo timeline for just the two of you, plus daily questions, letters, and games that Between does not offer.'],
    ],
  },
  {
    slug: 'lasting',
    name: 'Lasting',
    tagline: 'Structured relationship counseling exercises based on marriage research',
    strengths: [
      'Grounded in marriage counseling research',
      'Structured programs for communication and conflict',
      'Good fit for couples doing intentional repair work',
    ],
    gaps: [
      'Feels like homework by design — sessions, not rituals',
      'Trial-only free tier with a significant subscription',
      'Not designed around the daily texture of long-distance life',
    ],
    pickThemIf: 'you are actively working through relationship issues and want a therapy-style program.',
    pickFarFoxIf: 'you want lightweight daily connection that does not feel like an assignment.',
    pricingNote: 'Lasting is subscription-based after a trial. Far Fox core features are free.',
    faqs: [
      ['Is Far Fox a relationship therapy app?', 'No. Far Fox is a daily-connection app — questions, letters, photos, and games. Couples who want structured counseling exercises may prefer a dedicated program.'],
    ],
  },
  {
    slug: 'loklok',
    name: 'LokLok',
    tagline: 'A shared drawing canvas on your lock screen',
    strengths: [
      'Charming single idea: doodles that appear on your partner\'s lock screen',
      'Very low effort to use',
    ],
    gaps: [
      'It is one feature, not a relationship app',
      'No questions, letters, photos, games, plans, or messaging',
      'Limited platform support and inconsistent updates',
    ],
    pickThemIf: 'you want one cute touchpoint and already use another app for everything else.',
    pickFarFoxIf: 'you want the full toolkit for staying close across distance in one app.',
    pricingNote: 'LokLok is free. Far Fox core features are also free.',
    faqs: [
      ['Can Far Fox replace LokLok?', 'Far Fox covers much more ground — daily questions, letters, photos, games, and countdowns — though it does not draw on your lock screen.'],
    ],
  },
];
