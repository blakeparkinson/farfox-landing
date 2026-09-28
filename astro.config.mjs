// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// Blog lastmod comes from each post's own frontmatter so the sitemap only
// reports real edits. Other pages have no reliable edit date, so they omit it.
const blogDir = new URL('./src/content/blog/', import.meta.url);
const blogLastmod = Object.fromEntries(
  readdirSync(blogDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = readFileSync(new URL(file, blogDir), 'utf8');
      const field = (name) => source.match(new RegExp(`^${name}:\\s*"?([0-9-]+)"?`, 'm'))?.[1];
      return [`https://lovefarfox.com/blog/${file.replace(/\.md$/, '')}/`, field('updatedDate') || field('date')];
    })
    .filter(([, date]) => date),
);

// https://astro.build/config
export default defineConfig({
  site: 'https://lovefarfox.com',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    sitemap({
      filter: (page) =>
        ![
          '/jersey/',
          '/map/',
          '/couple-quiz/',
          '/etsy-map-redeem/',
        ].some((skip) => page.includes(skip)),
      serialize: (item) => {
        const lastmod = blogLastmod[item.url];
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  adapter: vercel({
    webAnalytics: { enabled: true },
  })
});
