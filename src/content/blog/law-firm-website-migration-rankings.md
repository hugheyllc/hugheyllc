---
title: "The Law Firm Website Migration Disaster: Keeping Rankings When You Move Domains"
slug: "law-firm-website-migration-rankings"
date: 2026-11-22
author: "Joe Hughey"
excerpt: "More law firms tank their rankings during a domain migration than from any algorithm update. Here's the step-by-step execution that keeps your SEO alive when you move websites."
tags: ["law firm SEO", "website migration", "domain migration", "law firm marketing", "technical SEO"]
seo_title: "Law Firm Website Migration SEO: Keep Rankings When You Move Domains"
seo_description: "Moving your law firm's website to a new domain? Most firms lose traffic by skipping these critical SEO steps. Here's how to migrate without destroying your rank"
draft: false
image: "/images/blog/law-firm-website-migration-rankings.jpg"
---

# The Law Firm Website Migration Disaster: Keeping Rankings When You Move Domains

Here's the short answer to what most firms want to know: you preserve law firm website rankings during a domain migration by implementing permanent 301 redirects from every old URL to its exact new equivalent, updating every external citation and directory listing, and giving Google an explicit roadmap through updated sitemaps and Search Console property configuration. What SEO steps are required when a law firm changes domains? At minimum: a full URL audit before launch, a redirect map covering 100% of indexed pages, canonical tag verification, updated internal links, and a post-migration monitoring window of no less than 90 days. Law firms lose traffic after moving websites because they skip one or more of these steps — usually the redirect map, the citations, or the monitoring. It is almost never the algorithm. It is almost always the execution.

If your firm is planning a migration and someone on your team just said "the developer will handle the SEO stuff," this post is for you.

---

## Why Migrations Kill Rankings More Than Algorithm Updates

Law firm SEO is built on accumulated authority — years of backlinks, citation signals, indexed content, and behavioral data Google has collected about your pages. A domain migration, done wrong, tells Google you've abandoned that authority. It doesn't transfer automatically. It has to be engineered.

Most migrations go sideways for one of three reasons:

1. **The redirect map is incomplete.** Someone mapped the top 20 pages and called it done. The other 200 pages — including practice area subpages, blog posts, and attorney bios that had real link equity — now return 404 errors.
2. **Citations and directory listings still point to the old domain.** Google's local ranking signals depend on consistent NAP (name, address, phone) data across the web. If your old domain is still live in directories, you've created a conflicting signal. If it's dead, you've broken hundreds of backlinks.
3. **The monitoring window is nonexistent.** The firm launched, did a quick Google search for their own name, saw the site come up, and declared victory. Three months later, organic traffic is down 60%.

This is not theoretical. It is the most predictable way a law firm destroys years of SEO investment in a single afternoon.

---

## The Pre-Migration Audit: Do This Before You Touch Anything

**Law firm website migration SEO** starts long before launch day. It starts with a full inventory of what you're moving.

Crawl your existing site completely. Export every URL, every internal link, every page title, every meta description, and every inbound link you can identify through Google Search Console and any backlink tool you use. This is your source of truth. Without it, you're redirecting blind.

Specifically, you need to identify:

- **All indexed URLs** — not just the ones in your navigation
- **Pages with meaningful backlinks** — these carry equity you can't afford to lose
- **High-traffic pages** — anything driving consistent organic visits needs a perfect redirect
- **Canonical tags** — if your current site has canonicalization issues, now is the time to fix them, not carry them over

If your firm has multiple office locations and has built out location-specific pages, pay close attention here. The [consolidation trap that hits multi-office law firms with geographic keywords](/blog/multi-office-law-firm-geo-keywords/) often gets worse during migrations when location pages get restructured or dropped entirely.

---

## Building the Redirect Map

A redirect map is a spreadsheet. Old URL in one column, new URL in the other. Every single indexed page gets a row. If a page isn't being carried over to the new site, you still need to redirect it — either to the closest equivalent or to the homepage as a last resort.

**301 redirects only.** Not 302. Not meta refreshes. A 301 tells Google the move is permanent and passes the majority of link equity. A 302 does not.

Common mistakes here:

- **Redirect chains** — old URL redirects to a middle URL that redirects to the new URL. Each hop bleeds equity. Redirect directly.
- **Redirect loops** — Page A redirects to Page B which redirects to Page A. Usually a developer error. Devastating.
- **Homepage dumping** — Every old URL redirects to the homepage instead of the equivalent new page. Google sees this as a soft 404. The equity evaporates.

After you build the map, have someone else audit it. Fresh eyes catch gaps the person who built it won't see.

---

## The Launch Checklist

On migration day and immediately after, there's a specific sequence that matters.

**Before going live:**
- Confirm all 301 redirects are implemented and tested
- Verify the new site's robots.txt is not blocking crawlers
- Confirm canonical tags on the new site point to new domain URLs, not old ones
- Check that the XML sitemap reflects the new domain and new URL structure

**Day of launch:**
- Submit the new sitemap in Google Search Console under the new property
- Use the Change of Address tool in Search Console if the domain name itself is changing
- Verify the old domain property in Search Console is still accessible for monitoring

**First 90 days:**
- Monitor crawl errors weekly in Search Console
- Watch for drops in indexed page count
- Track ranking positions for your core practice area and location keywords
- Check for any manual actions or crawl anomalies

This is also a good time to review whether your internal linking structure actually serves your SEO goals. Most law firm sites have never had this mapped intentionally — a gap that [costs rankings over time in ways that are easy to miss](/blog/internal-linking-strategy-law-firms/).

---

## Citations and Backlinks: The Step Everyone Forgets

You've got the redirects right. Good. Now Google still needs to see that the web's external signals — directories, bar association listings, legal directories, chamber profiles, local citations — are pointing somewhere that works.

If your old domain goes dark and those citations aren't updated, you've broken hundreds of signals that contribute to both organic and local pack rankings. Even if you keep the old domain live and redirecting, those citations need to be updated to your new canonical domain.

This is tedious work. It is also non-negotiable. And it doesn't happen fast — budget 60 to 90 days for the citation update cycle to propagate. If your firm has accumulated citation drift over the years, a migration is actually a good time to clean the whole thing up. Outdated and inconsistent directory listings are already [dragging down your authority in ways you may not have attributed to them](/blog/citation-decay-outdated-listings/).

---

## Content Quality: Don't Migrate Junk

A migration is not just a technical event. It's an opportunity to audit what you're bringing over.

Low-quality, thin, or duplicate pages that have been sitting on your old site aren't worth migrating. If a page has no traffic, no backlinks, and no strategic purpose, redirecting it to a relevant page or simply letting it 404 may be the right call. What you do not want to do is migrate 300 pages of dead weight and then wonder why the new site doesn't perform better than the old one.

This connects directly to how law firms should think about [content audits before making decisions about what to keep, redirect, or delete](/blog/law-firm-content-audit-delete-strategy/). The same logic that applies to pruning a live site applies here.

Also: if the new site is getting new copy as part of the migration, make sure it sounds like your firm and not like a legal services content farm. [Authentic voice in law firm website copy](/blog/law-firm-website-copy-authentic-voice/) is a ranking factor in the sense that it drives engagement, reduces bounce rates, and builds the kind of trust that converts visitors into calls.

---

## After the Migration: What You're Watching For

A successful migration is not one where nothing broke on launch day. It's one where rankings and traffic have stabilized or improved at the 90-day mark.

Expect some fluctuation in the first few weeks. Google is re-crawling, re-indexing, and re-evaluating. That is normal. What is not normal: a sustained drop in indexed pages, a steady decline in organic sessions, or practice area keywords that have disappeared from the first three pages entirely.

If you're seeing those signals, go back to the redirect map first. Then check canonical tags. Then look at crawl coverage in Search Console. The answer is almost always in one of those three places.

---

If your firm is planning a migration and you want someone to actually review the execution plan before you launch — not after traffic drops — [that's a conversation worth having](/contact/).

*Related: [The Citation Decay Problem: Why Your Law Firm's Old Directory Listings Are Tanking Authority](/blog/citation-decay-outdated-listings/) | [Internal Linking Architecture for Law Firms: The Map Nobody Draws (Until Rankings Drop)](/blog/internal-linking-strategy-law-firms/)*
