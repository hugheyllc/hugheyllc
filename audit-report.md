# SEO & AEO Audit Report - hugheyllc.com
**Run Date:** August 9, 2026 | **Status:** IN PROGRESS

## Quick Findings

Checking about.astro...
Checking blog.astro...
Checking client-requests.astro...
Checking contact.astro...
Checking index.astro...
Checking insights.astro...
Checking location.astro...
Checking privacy-policy.astro...
Checking privacy.astro...
Checking search.astro...
Checking services.astro...
Checking terms.astro...

## 1. ROBOTS.TXT & CRAWLABILITY

# Allow all crawlers
User-agent: *
Allow: /

# Disallow specific paths
Disallow: /admin
Disallow: /admin/
Disallow: /pagefind/
Disallow: /api/
Disallow: /*.json$
Disallow: /private
Disallow: /draft

# Sitemap reference
Sitemap: https://hugheyllc.com/sitemap-index.xml

# Crawl delay (optional - removes if slowing down indexing)
# Crawl-delay: 1

# Specific user agent rules
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

# Block bad bots
User-agent: MJ12bot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Crawl-delay: 10

## 2. SITEMAP STATUS

✓ Sitemap index exists
<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://hugheyllc.com/sitemap-0.xml</loc></sitemap></sitemapindex>