import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://hugheyllc.com',
  integrations: [sitemap()],
  output: 'static',
  trailingSlash: 'always',
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: false,
  }),
});
