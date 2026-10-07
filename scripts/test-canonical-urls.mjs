import { canonicalRedirectRules, isCanonicalRedirect, MAX_ROUTE_SRC } from './canonical-redirect-rules.mjs';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const clientDir = join(root, 'dist/client');

async function collectPages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const pages = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      pages.push(...await collectPages(path));
    } else if (entry.isFile() && entry.name === 'index.html') {
      const page = relative(clientDir, path).split(sep).join('/');
      if (page !== 'index.html') pages.push(page.slice(0, -'/index.html'.length));
    }
  }
  return pages;
}

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

const pages = await collectPages(clientDir);
const pageSet = new Set(pages);
const config = JSON.parse(await readFile(join(root, '.vercel/output/config.json'), 'utf8'));
const expected = canonicalRedirectRules(pages);
const redirects = config.routes.map((route, index) => ({ route, index })).filter(({ route }) => isCanonicalRedirect(route));
assert.deepEqual(redirects.map(({ route }) => route), expected, 'The canonical page redirects are exactly the rules built from the page list');
assert.deepEqual(redirects.map(({ index }) => index), expected.map((_, i) => i), 'Canonical redirects come first in the routes array');
for (const { route } of redirects) assert.ok(route.src.length <= MAX_ROUTE_SRC, `Each redirect src fits Vercel's route limit (${route.src.length})`);

const rules = redirects.map(({ route }) => new RegExp(route.src));
const matches = { test: (path) => rules.some((rule) => rule.test(path)) };
for (const page of pages) assert.equal(rules.filter((rule) => rule.test(`/${page}`)).length, 1, `Exactly one rule redirects /${page}`);
for (const path of [
  '/blog/long-distance-relationship-timeline',
  '/tools',
  '/blog',
  '/compare/paired',
  '/long-distance/new-york-to-london',
]) assert.ok(matches.test(path), `Redirect matches ${path}`);
for (const path of [
  '/blog/long-distance-relationship-timeline/',
  '/',
  '/api/geocode',
  '/api/snipcart-webhook',
  '/rss.xml',
  '/blog/long-distance-relationship-statistics/og.png',
  '/match/a/b',
]) assert.equal(matches.test(path), false, `Redirect does not match ${path}`);

let checked = 0;
function checkUrl(value, source) {
  let pathname;
  if (value.startsWith('/')) {
    pathname = value.split(/[?#]/, 1)[0];
  } else {
    try {
      const url = new URL(value);
      if (url.hostname !== 'lovefarfox.com') return;
      pathname = url.pathname;
    } catch {
      return;
    }
  }

  if (pathname === '/') {
    checked++;
    return;
  }
  if (pathname.endsWith('/')) {
    if (pageSet.has(pathname.slice(1, -1))) checked++;
    return;
  }
  if (pageSet.has(pathname.slice(1))) {
    assert.fail(`Non-canonical internal page link in ${source}: ${value}`);
  }
}

for (const file of await collectHtml(clientDir)) {
  const html = await readFile(file, 'utf8');
  const source = relative(clientDir, file).split(sep).join('/');
  for (const match of html.matchAll(/\bhref\s*=\s*(["'])(.*?)\1/gs)) checkUrl(match[2], source);
  for (const match of html.matchAll(/https:\/\/lovefarfox\.com[^"'\s<>)]*/g)) checkUrl(match[0], source);
}

const rssPath = join(clientDir, 'rss.xml');
const rss = await readFile(rssPath, 'utf8');
for (const match of rss.matchAll(/<(?:link|guid)\b[^>]*>([\s\S]*?)<\/(?:link|guid)>/g)) {
  checkUrl(match[1].trim(), 'rss.xml');
}
for (const match of rss.matchAll(/\bhref="([^"]+)"/g)) checkUrl(match[1], 'rss.xml');

console.log(`Canonical URL checks passed: redirect scope and ${checked} internal page links checked.`);
