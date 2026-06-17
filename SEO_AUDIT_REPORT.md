# SEO & AEO Audit Report — hugheyllc.com
**Date:** 2026-06-17  
**Auditor:** Micky (Ops Director AI)  
**Codebase:** `/data/Coding/hugheyllc-website` (Astro 4, Vercel)

---

## Executive Summary

The site has a solid technical SEO foundation: structured data is well-implemented, canonical URLs are consistently set, OG/Twitter cards are present on all pages, and the blog infrastructure is clean. Seven issues were identified and fixed directly. Several architectural improvements are documented below for Joe's review.

**Overall SEO health: Good. AEO coverage: Above average for the niche.**

---

## FIXES APPLIED (7 changes — ready to review and push)

### 1. `robots.txt` — Sitemap URL Domain Mismatch ✅ FIXED
**File:** `public/robots.txt`  
**Issue:** Sitemap reference used `www.hugheyllc.com` but the canonical domain is `hugheyllc.com` (no www). Googlebot would follow it correctly, but it's inconsistent and could confuse other crawlers.  
**Fix:** Changed `Sitemap: https://www.hugheyllc.com/sitemap-index.xml` → `https://hugheyllc.com/sitemap-index.xml`

---

### 2. Sitemap — OAuth Callback Page Included ✅ FIXED
**File:** `astro.config.mjs`  
**Issue:** `/oauth/callback/` was appearing in the sitemap despite having `noindex, nofollow` in its own `<head>`. Pages with noindex should never appear in sitemaps — Google treats this as contradictory signals.  
**Fix:** Added `'https://hugheyllc.com/oauth/callback/'` to the sitemap filter exclusion list.

---

### 3. Sitemap — Missing lastmod, priority, changefreq ✅ FIXED
**File:** `astro.config.mjs`  
**Issue:** The sitemap had no `lastmod`, `priority`, or `changefreq` values. While Google largely ignores `changefreq` and `priority`, `lastmod` is used for crawl scheduling.  
**Fix:** Added a `serialize()` function to the sitemap integration that sets:
- Homepage: `priority: 1.0`, `changefreq: weekly`
- Blog/Insights: `priority: 0.7`, `changefreq: monthly`
- Services/Florida pages: `priority: 0.8`, `changefreq: monthly`
- All others: `priority: 0.6`, `changefreq: monthly`
- `lastmod`: current build date (ISO format)

---

### 4. BaseLayout — OG Image Default Inconsistency ✅ FIXED
**File:** `src/layouts/BaseLayout.astro`  
**Issue:** `defaultOgImage` referenced `/images/og-default.svg`, but the blog post template (`[slug].astro`) used `/images/og-default.png` as fallback. Social platforms handle SVG inconsistently — PNG is the safe standard.  
**Fix:** Changed `defaultOgImage` in `BaseLayout.astro` to `/images/og-default.png`. Both files exist in `/public/images/`.

---

### 5. BaseLayout — Missing `<link rel="sitemap">` ✅ FIXED
**File:** `src/layouts/BaseLayout.astro`  
**Issue:** The `<head>` had no `<link rel="sitemap" href="/sitemap-index.xml" />`. This is a standard HTML signal for crawlers to auto-discover the sitemap.  
**Fix:** Added `<link rel="sitemap" href="/sitemap-index.xml" />` after the canonical tag.

---

### 6. `location.astro` — Schema Prop Passed as JSON String ✅ FIXED
**File:** `src/pages/location.astro`  
**Issue:** `schema={JSON.stringify(schema)}` was being passed to `BaseLayout`, which expects a plain object (it does its own `JSON.stringify` internally). This would produce double-encoded JSON in the rendered HTML, breaking the structured data entirely.  
**Fix:** Changed to `schema={schema}`.

---

### 7. Blog Post — Empty `seo_description` and `excerpt` ✅ FIXED
**File:** `src/content/blog/how-much-should-a-small-law-firm-really-spend-on-marketing-in-2025.md`  
**Issue:** Both `seo_description` and `excerpt` were empty strings. An empty meta description causes Google to auto-generate one, often poorly.  
**Fix:** Added a 158-char `seo_description` and a concise `excerpt`. Also shortened `seo_title` from 67 chars to 58 chars (under the 60-char soft limit).

---

## ADDITIONAL FIXES APPLIED (trimming overlong descriptions)

Several `seo_description` values were over 160 characters (the threshold where Google truncates). Fixed in:
- `florida-bar-law-firm-advertising-rules.md` (189 → 158 chars)
- `from-seo-to-aeo-structuring-your-site-so-ai-and-humans-choose-your-firm-2.md` (171 → 159 chars)
- `google-ads-law-firms.md` (185 → 155 chars)
- `law-firm-marketing-consultant-tampa-bay.md` (182 → 156 chars)
- `law-firm-marketing-pinellas-county.md` (177 → 155 chars)
- `law-firm-marketing-st-petersburg-fl.md` (177 → 158 chars)

---

## ARCHITECTURAL IMPROVEMENT — `updated_date` Field

**Files:** `src/content/config.ts`, `src/pages/blog/[slug].astro`  
Added optional `updated_date` field to the blog collection schema. The Article JSON-LD `dateModified` now uses `updated_date ?? date`, so when a post is significantly updated, you can set `updated_date: YYYY-MM-DD` in the frontmatter and Google will see the correct last-modified signal.

**Usage:** Add to any updated post's frontmatter:
```yaml
updated_date: 2026-06-17
```

---

## ISSUES IDENTIFIED — NO FIX APPLIED (architectural or low-priority)

### A. Blog Titles Exceed 60-Char Soft Limit
**Scope:** ~70 of 98 blog posts  
**Issue:** Most `seo_title` values are 65–113 characters. Google truncates titles in SERPs at ~60 chars (600px). Full keyword phrases are preserved in the rendered title but tail gets cut.  
**Recommendation:** The long titles are likely intentional — legal marketing benefits from full keyword phrase targeting. However, the most important keywords should appear in the first 50-60 chars. Consider auditing the highest-traffic posts and front-loading keywords.  
**Not fixed:** Would require 70+ individual judgment calls on rewriting titles.

### B. Sitemap — Per-Post `lastmod` Not Using Actual Post Dates
**Issue:** The sitemap `lastmod` currently uses the build date for all pages. Ideally, blog posts would use their `date` (or `updated_date`) frontmatter field.  
**Recommendation:** This requires a custom sitemap endpoint (e.g., `src/pages/sitemap.xml.ts`) to pull blog collection data and generate per-entry `lastmod` from frontmatter. The `@astrojs/sitemap` integration's `serialize()` function only receives the URL, not content metadata.  
**Architecture:** Create a `/src/pages/sitemap-blog.xml.ts` custom sitemap for blog entries and add it to the sitemap index, or replace the Astro sitemap integration entirely with a custom implementation.

### C. Article Schema — `dateModified` Equals `datePublished` on All Existing Posts
**Issue:** All existing posts have `dateModified = datePublished` because no `updated_date` fields exist yet. Google may downweight content that has never been "updated."  
**Recommendation:** For high-value evergreen posts (local SEO, agency vs. consultant, intake optimization), add `updated_date` to signal freshness. The infrastructure is now in place.

### D. AEO — No `HowTo` Schema
**Issue:** Several posts contain numbered step-by-step instructions (e.g., `callrail-law-firm-setup-guide.md`, `ga4-setup-law-firm-guide.md`, `law-firm-intake-process-audit.md`) but lack `HowTo` structured data. `HowTo` schema can trigger rich results and improve AI citation likelihood.  
**Recommendation:** Add a `howTo` frontmatter field or detection logic in `[slug].astro` to auto-generate `HowTo` schema from numbered lists.

### E. AEO — Speakable Schema Uses Generic CSS Selectors
**Issue:** The speakable schema in `BaseLayout.astro` targets `.h-hl`, `.h-sub`, `h1`, `h2` globally. This is valid but generic. Speakable works best when pointing to specific concise answer paragraphs.  
**Recommendation:** On blog posts, consider adding a `.speakable-summary` class to the first paragraph or a dedicated TL;DR block, and update the speakable selector to include it.

### F. Internal Linking — No Automated Related Posts
**Issue:** Blog posts link to each other manually (inline hrefs). There's no "related posts" section at the end of articles to strengthen topical clusters.  
**Recommendation:** Add a related-posts component to `[slug].astro` that surfaces 3 posts sharing the same tags. This improves internal link equity distribution and dwell time.

### G. `location.astro` — Consider Adding `noindex`
**Issue:** The `/location/` page is a thin directory-style page with limited unique content. It's currently indexed.  
**Recommendation:** Either enrich the page with substantial unique local content (map embed, testimonials, service area narrative) or add `noindex` to focus crawl budget on higher-value pages.

### H. `og-default.svg` — Unused File
**Issue:** `/public/images/og-default.svg` still exists in the repo but is no longer referenced after the `.png` fix (fix #4).  
**Recommendation:** Delete `og-default.svg` to keep the codebase clean. Minor.

### I. Insights Collection — Missing `author` and Schema Fields
**Issue:** The insights content schema has only `title`, `slug`, `excerpt`, `date`. Insights pages (e.g., `/insights/seo-law-firms-ai-search-world/`) don't appear to have Article schema. Check `src/pages/insights/[slug].astro`.  
**Recommendation:** Add `author`, `seo_title`, `seo_description` fields to the insights schema and add Article + BreadcrumbList schema to the insights slug template, matching the blog implementation.

---

## STRENGTHS (No Action Needed)

- ✅ **Canonical URLs** — correctly set on all pages, including blog posts
- ✅ **OG + Twitter Cards** — complete and correct on all pages
- ✅ **LocalBusiness + Organization schema** — on every page via BaseLayout
- ✅ **FAQPage schema** — homepage, all service pages, about page
- ✅ **Article + BreadcrumbList schema** — all blog posts
- ✅ **Speakable schema** — present on all pages via BaseLayout
- ✅ **robots.txt** — well-structured with bot-specific rules
- ✅ **Accessibility** — `skip-link`, proper `lang="en"`, semantic `<main>` with `id="main-content"`
- ✅ **Font performance** — LCP font self-hosted with `preload`, remaining fonts deferred
- ✅ **Image preloading** — `preloadImage` prop in BaseLayout for above-fold images
- ✅ **E-E-A-T signals** — Person schema for Joe Hughey, author bio on all blog posts
- ✅ **LLMs.txt** — present at `/public/llms.txt` (AEO signal for AI crawlers)
- ✅ **Search functionality** — Pagefind integration for site search
- ✅ **Sitemap filter** — correctly excludes noindex/utility pages (with oauth/callback now added)
- ✅ **All blog posts indexed** — 98 posts all appear in sitemap, no drafts published

---

## SUMMARY TABLE

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | robots.txt sitemap URL (www vs no-www) | Medium | ✅ Fixed |
| 2 | oauth/callback in sitemap | Medium | ✅ Fixed |
| 3 | Sitemap missing lastmod/priority | Medium | ✅ Fixed |
| 4 | OG image default inconsistency (SVG vs PNG) | Low | ✅ Fixed |
| 5 | Missing `<link rel="sitemap">` in BaseLayout | Low | ✅ Fixed |
| 6 | location.astro schema double-JSON-stringified | High | ✅ Fixed |
| 7 | Empty seo_description on budget post | High | ✅ Fixed |
| 8 | 6 descriptions over 160 chars | Low-Medium | ✅ Fixed |
| 9 | updated_date field added to blog schema | Enhancement | ✅ Fixed |
| A | 70+ blog titles exceed 60-char soft limit | Low | Documented |
| B | Sitemap lastmod not using post dates | Medium | Documented |
| C | dateModified = datePublished on all posts | Medium | Documented |
| D | No HowTo schema on guide posts | Medium | Documented |
| E | Speakable selectors too generic | Low | Documented |
| F | No related posts / internal link clusters | Medium | Documented |
| G | location.astro thin content / consider noindex | Low | Documented |
| H | og-default.svg unused file | Trivial | Documented |
| I | Insights collection missing author/Article schema | Medium | Documented |
