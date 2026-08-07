/**
 * Submit every sitemap URL to IndexNow so Bing, DuckDuckGo, Yandex,
 * Seznam, and Naver discover new pages within hours instead of weeks.
 *
 * Usage: node scripts/submit-indexnow.mjs
 * Run after every production deploy that adds or changes pages.
 */
const HOST = 'lovefarfox.com';
const KEY = '48b9419823aeadbf6e06192ccaa88c6e';

async function sitemapUrls() {
  const index = await fetch(`https://${HOST}/sitemap-index.xml`).then((r) => r.text());
  const sitemaps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const urls = [];
  for (const sitemap of sitemaps) {
    const xml = await fetch(sitemap).then((r) => r.text());
    urls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  }
  return [...new Set(urls)];
}

const urlList = await sitemapUrls();
if (urlList.length === 0) {
  console.error('No URLs found in the sitemap — aborting.');
  process.exit(1);
}

const keyOk = await fetch(`https://${HOST}/${KEY}.txt`).then((r) => r.ok);
if (!keyOk) {
  console.error(`Key file https://${HOST}/${KEY}.txt is not live yet — deploy first.`);
  process.exit(1);
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, urlList }),
});

console.log(`Submitted ${urlList.length} URLs to IndexNow — HTTP ${response.status}`);
if (!response.ok && response.status !== 202) {
  console.error(await response.text());
  process.exit(1);
}
