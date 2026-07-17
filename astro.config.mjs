import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hugheyllc.com',
  integrations: [
    sitemap({
      serialize(item) {
        // Add lastmod and priority hints for all sitemap entries
        item.lastmod = new Date().toISOString().split('T')[0];
        if (item.url === 'https://hugheyllc.com/') {
          item.changefreq = 'weekly';
          item.priority = 1.0;
        } else if (item.url.includes('/blog/') || item.url.includes('/insights/')) {
          item.changefreq = 'monthly';
          item.priority = 0.7;
        } else if (item.url.includes('/services/') || item.url.includes('/florida/')) {
          item.changefreq = 'monthly';
          item.priority = 0.8;
        } else {
          item.changefreq = 'monthly';
          item.priority = 0.6;
        }
        return item;
      },
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
          // OAuth utility page — noindex, should not be in sitemap
          'https://hugheyllc.com/oauth/callback/',
          'https://hugheyllc.com/client-requests/',
          'https://hugheyllc.com/admin/client-requests/',
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
    // Sharp-based image optimization (default)
    // No passthrough — Astro will optimize <Image> components
  },
});
