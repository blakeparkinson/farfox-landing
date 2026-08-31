// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://lovefarfox.com',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    sitemap({
      customPages: ['https://lovefarfox.com/rss.xml'],
      filter: (page) =>
        ![
          '/jersey/',
          '/map/',
          '/couple-quiz/',
          '/etsy-map-redeem/',
        ].some((skip) => page.includes(skip)),
    }),
  ],
  adapter: vercel({
    webAnalytics: { enabled: true },
  })
});
