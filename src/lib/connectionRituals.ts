/**
 * Mirror of `lib/features/connection_rituals/models/connection_ritual.dart`
 * in the FarFox Flutter app. Keep in sync when questions/choices change.
 *
 * We duplicate rather than fetch because:
 *   - These are stable constants (not dynamic per-couple data).
 *   - Avoiding a second network round-trip keeps the public profile
 *     page fast (one Supabase call, not two).
 */

export interface RitualChoice {
  key: string;
  emoji: string;
  label: string;
}

export interface RitualQuestion {
  key: string;
  prompt: string;
  choices: RitualChoice[];
}

export const RITUAL_QUESTIONS: RitualQuestion[] = [
  {
    key: 'miss_signal',
    prompt: 'When I miss you, what I want most is…',
    choices: [
      { key: 'voice_note', emoji: '🎙️', label: 'A voice note' },
      { key: 'phone_call', emoji: '📞', label: 'A phone call' },
      { key: 'sweet_text', emoji: '💌', label: 'A sweet text' },
      { key: 'photo', emoji: '📷', label: 'A photo of your day' },
    ],
  },
  {
    key: 'hard_day',
    prompt: 'On a hard day, what helps me most is…',
    choices: [
      { key: 'presence', emoji: '🤗', label: 'Just being present with me' },
      { key: 'reassurance', emoji: '💬', label: "Hearing it'll be okay" },
      { key: 'distraction', emoji: '😄', label: 'A laugh or distraction' },
      { key: 'space', emoji: '🌿', label: 'Quiet space to recover' },
    ],
  },
  {
    key: 'fav_message',
    prompt: 'My favorite kind of message from you…',
    choices: [
      { key: 'compliment', emoji: '🥰', label: 'A compliment about me' },
      { key: 'inside_joke', emoji: '🤣', label: 'An inside joke' },
      { key: 'thinking_of_you', emoji: '💭', label: '"Thinking of you"' },
      { key: 'future_plan', emoji: '📅', label: 'A future plan' },
    ],
  },
  {
    key: 'perfect_day',
    prompt: 'A perfect day off together looks like…',
    choices: [
      { key: 'cooking', emoji: '🍳', label: 'Cooking at home' },
      { key: 'cozy', emoji: '🎬', label: 'Curled up watching something' },
      { key: 'outside', emoji: '🥾', label: 'Outside, exploring' },
      { key: 'long_talks', emoji: '💬', label: 'Long talks over coffee' },
    ],
  },
  {
    key: 'thoughtful_gestures',
    prompt: 'The thoughtful gestures I notice most…',
    choices: [
      { key: 'small_daily', emoji: '☕', label: 'Small daily things' },
      { key: 'planned_surprises', emoji: '🎁', label: 'Planned surprises' },
      { key: 'time_carved', emoji: '⏰', label: 'Time carved out for us' },
      { key: 'acts_of_help', emoji: '🛠️', label: 'Acts of help' },
    ],
  },
  {
    key: 'want_more',
    prompt: "What I'd love more of in our relationship…",
    choices: [
      { key: 'physical', emoji: '🤲', label: 'Physical closeness' },
      { key: 'deep_talks', emoji: '🌊', label: 'Deep conversations' },
      { key: 'playfulness', emoji: '🎲', label: 'Fun and playfulness' },
      { key: 'adventure', emoji: '🎯', label: 'Adventure & new things' },
    ],
  },
];

export function findChoice(
  questionKey: string,
  choiceKey: string,
): RitualChoice | undefined {
  const q = RITUAL_QUESTIONS.find((q) => q.key === questionKey);
  return q?.choices.find((c) => c.key === choiceKey);
}

/**
 * Builds the single-line personalized tagline shown at the top of the
 * profile. Matches the in-app version.
 */
export function ritualsTagline(answers: Record<string, string>): string {
  const missSignal = findChoice('miss_signal', answers.miss_signal ?? '');
  const wantMore = findChoice('want_more', answers.want_more ?? '');
  if (missSignal && wantMore) {
    return `Feels loved through ${wantMore.label.toLowerCase()} and ${missSignal.label.toLowerCase()}.`;
  }
  return 'A picture of how I feel loved — in my own words.';
}
