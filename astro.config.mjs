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
          // noindex pages — should not be in sitemap
          'https://hugheyllc.com/resources/playbook-download/',
          'https://hugheyllc.com/resources/playbook-download-reviewed/',
          // Terms/privacy already have canonical, not high-value for indexing
          'https://hugheyllc.com/terms/',
          'https://hugheyllc.com/privacy-policy/',
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
