import { defineConfig, passthroughImageService } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hugheyllc.com',
  integrations: [
    sitemap({
      filter: (page) => {
        // Exclude utility/redirect/noindex pages from sitemap
        const exclude = [
          'https://hugheyllc.com/search/',
          'https://hugheyllc.com/privacy/',
          'https://hugheyllc.com/admin/',
          'https://hugheyllc.com/admin',
        ];
        return !exclude.includes(page);
      },
    }),
  ],
  output: 'static',
  trailingSlash: 'always',
  build: {
    assets: 'assets',
  },
  image: {
    service: passthroughImageService(),
  },
});
