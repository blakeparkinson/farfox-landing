// Only campaign labels belong in analytics, never quiz answers or names.
export function campaignAttribution(saved: Record<string, string>, query: URLSearchParams) {
  return Object.fromEntries(['source', 'medium', 'campaign', 'content', 'term'].map((field) => [
    field, (saved[`utm_${field}`] || query.get(`utm_${field}`) || (field === 'source' ? 'direct' : '')).slice(0, 200),
  ]));
}
