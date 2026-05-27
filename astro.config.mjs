import { defineConfig, passthroughImageService } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hugheyllc.com',
  integrations: [sitemap()],
  output: 'static',
  trailingSlash: 'always',
  build: {
    assets: 'assets',
  },
  image: {
    service: passthroughImageService(),
  },
});
