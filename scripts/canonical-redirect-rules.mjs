// The 308 rules that send each prerendered page's slashless path to its canonical trailing-slash URL.
// One alternation per rule, split so no rule's src passes Vercel's 4,096-character route limit.
export const MAX_ROUTE_SRC = 4000;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function canonicalRedirectRules(pages) {
  const rules = [];
  let group = [];
  const close = () => { if (group.length) rules.push({ src: `^/(${group.join('|')})$`, headers: { Location: '/$1/' }, status: 308 }); group = []; };
  for (const page of [...pages].sort()) {
    const next = escapeRegex(page);
    if (group.length && `^/(${[...group, next].join('|')})$`.length > MAX_ROUTE_SRC) close();
    group.push(next);
  }
  close();
  return rules;
}

export const isCanonicalRedirect = (route) => route.status === 308 && route.headers?.Location === '/$1/' && route.src?.startsWith('^/(');
