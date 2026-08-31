import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog')).sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  );

  const items = posts
    .map((post) => {
      const url = `https://lovefarfox.com/blog/${post.id}`;
      return `    <item>
      <title>${xmlEscape(post.data.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(post.data.date).toUTCString()}</pubDate>
      <description>${xmlEscape(post.data.description)}</description>
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Far Fox — Long-Distance Relationship Guides</title>
    <link>https://lovefarfox.com/blog</link>
    <atom:link href="https://lovefarfox.com/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Practical guides for couples making long-distance work: questions, dates, letters, time zones, and daily rituals.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
