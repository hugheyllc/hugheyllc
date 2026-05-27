import { defineConfig, passthroughImageService } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://hugheyllc.com',
  integrations: [sitemap()],
  output: 'static',
  trailingSlash: 'always',
  image: {
    service: passthroughImageService(),
  },
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: false,
  }),
});
