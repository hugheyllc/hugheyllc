# Kenzsys — Firm Content OS

**The autonomous marketing engine built for law firms.**

---

## What It Is

Kenzsys Firm Content OS is a fully automated content and SEO system built specifically for law firms. It publishes original blog content daily, distributes it across social channels, and maintains a technically sound SEO infrastructure — all without requiring your staff to touch it.

You own every piece of content, every follower, every ranking. We build and operate the machine.

---

## What It Does Every Day

At 10am, automatically:

1. **Writes a new blog post** on a law firm marketing topic relevant to your practice area and market — 900 to 1,200 words, original, never duplicated
2. **Generates a custom header image** using AI image generation — dark, editorial, professional
3. **Publishes the post** to your website with no manual steps
4. **Posts to Twitter/X** — a punchy, opinionated take designed for engagement from your target clients
5. **Posts to LinkedIn** — a longer-form version optimized for LinkedIn's algorithm and audience

**That's 365 blog posts, 365 tweets, and 365 LinkedIn posts per year. Automatically.**

---

## Full Capability Set

### Content Engine
- Daily AI-generated blog posts (900–1,200 words per post)
- 30-topic content queue refreshed quarterly — practice area topics, local market content, competitive analysis, tactical guides
- AI-generated header images for every post — consistent brand aesthetic
- All content reviewed for accuracy and voice before queue entry

### Social Distribution
- **Twitter/X:** Daily provocative, high-engagement posts with blog link
- **LinkedIn:** Daily professional posts with commentary and CTA
- Voice calibrated to your firm's tone during onboarding
- Automatic token refresh — no manual re-authorization needed (annually)

### SEO Infrastructure
- **Technical SEO:** Canonical tags on every page, explicit robots directives, structured data (JSON-LD) for LocalBusiness, FAQPage, ProfessionalService, BreadcrumbList schemas
- **301 redirect mapping:** All old URLs preserved and redirected — no lost link equity
- **XML sitemap:** Auto-generated and submitted, excludes utility pages
- **FAQ schema** on highest-priority pages — eligible for Google rich results
- **Internal linking:** Every blog post cross-links to related posts — distributes authority across the site

### Performance
- All images compressed and served as JPEG (98% file size reduction vs. raw AI output)
- LCP (Largest Contentful Paint) hero image preloading
- Core Web Vitals optimized — typical desktop PageSpeed score 90+

### Lead Generation
- **Free lead magnet page** with email capture (e.g., "25-Point Law Firm Marketing Audit Checklist")
- Automatic checklist delivery via email on form submission
- Instant notification to firm's contact when a lead is captured

### Local SEO Expansion
- Dedicated city-specific landing pages for each market you serve (e.g., `/florida/orlando/`, `/florida/miami/`)
- Each page includes city-specific content, local schema markup, and a CTA
- Built to rank for "[city] law firm marketing consultant" queries

### Contact & Conversion
- Contact form with Resend integration — immediate email notification to firm
- Schedule-a-call CTA throughout the site
- All form submissions logged

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Site framework | Astro 6 (static) | Fast, SEO-friendly, zero runtime |
| Hosting | Vercel | Global CDN, instant deploys, 99.99% uptime |
| Source control | GitHub | Version control, deployment trigger |
| AI agent platform | OpenClaw | Autonomous agent infrastructure that runs all automation |
| Blog generation | Anthropic Claude (Haiku) | Content writing |
| Image generation | OpenAI GPT-Image-1 | Header images |
| Email delivery | Resend | Form notifications, lead magnet delivery |
| Twitter posting | Twitter API v2 | OAuth 2.0, auto-refresh |
| LinkedIn posting | LinkedIn UGC Posts API | OAuth 2.0 |
| Publish pipeline | GitHub Contents API | Commits content directly → triggers deploy |

---

## AI Integrations

### Anthropic Claude (Content Writing)
Used daily to generate blog posts and social media copy. Operates with a custom system prompt calibrated to your firm's voice, practice areas, and market. Produces publication-ready content — not drafts.

**What it writes:**
- Full blog posts (900–1,200 words) with H2 structure, bold key terms, internal links
- Twitter posts (under 280 characters, punchy and opinionated)
- LinkedIn posts (3–5 paragraphs, professional, engagement-optimized)

### OpenAI GPT-Image-1 (Image Generation)
Generates a custom editorial photograph for every blog post. Trained on a consistent style brief — dark backgrounds, warm gold lighting, professional law firm context. No stock photos.

### OpenClaw (Agent Infrastructure)
The autonomous AI agent platform that orchestrates all automation. OpenClaw runs the daily cron jobs, manages API credentials, handles token refresh, monitors for failures, and alerts when intervention is needed. It is the operating layer that keeps everything running.

---

## Monthly Operational Costs

These are costs the firm pays directly to API providers — no markup.

| Service | Estimated Monthly Cost |
|---------|----------------------|
| Anthropic API (blog + social content) | $3 – $8 |
| OpenAI API (daily images) | $3 – $8 |
| Vercel hosting | $0 – $20 (free tier sufficient for most firms) |
| Resend (email) | $0 (free up to 3,000 emails/month) |
| GitHub | $0 (free) |
| Domain name | ~$1/month amortized |
| **Total** | **~$7 – $37/month** |

*Twitter and LinkedIn APIs used are within free tiers for this posting volume.*

---

## What You Own

When we build this for your firm, you own:

- The domain
- The GitHub repository (every piece of content ever published)
- The Vercel project
- The Twitter account
- The LinkedIn profile
- The Anthropic API account
- The OpenAI API account
- Every blog post, every image, every social post — forever

If you ever stop working with us, the system continues to run on your own API keys. You are never locked in.

---

## What We Manage

- Initial build and configuration (2–3 weeks)
- Content queue strategy and quarterly refresh
- Social voice calibration
- SEO monitoring and technical issue resolution
- Platform updates as APIs change
- Annual OAuth re-authorization for social accounts
- Performance reporting (monthly)

---

## Engagement Options

### Build & Launch
One-time engagement to build the full system on your domain.

**Includes:**
- Full site build (or migration from existing site)
- Content engine setup and 90-day topic queue
- Social automation (Twitter + LinkedIn)
- SEO infrastructure (schema, sitemaps, redirects, internal linking)
- 6 location landing pages
- Lead magnet page with email capture
- Initial content audit and optimization

### Managed Operations
Monthly retainer to operate, monitor, and improve the system.

**Includes:**
- Daily publishing runs
- Monthly content queue refresh
- SEO performance review
- Social account health monitoring
- Platform maintenance

---

## Sample Daily Output

**Blog post:** *"Why Your Google Ads Dashboard Is Lying to You — And What to Track Instead"*
Published at 10am. 1,100 words. 5 internal links. FAQ schema. Custom header image.

**Twitter post:**
> Your Google Ads dashboard shows you clicks, impressions, and CTR.
>
> None of those pay your rent.
>
> The only number that matters: cost per retained client.
> Your dashboard probably doesn't show you that.

**LinkedIn post:**
> Most law firms I talk to can tell me their click-through rate. Almost none can tell me their cost per retained client.
>
> That gap is the entire reason marketing feels like a black box.
>
> Google Ads is designed to show you metrics that look good in a report. Impressions climbing, clicks up, CTR improving — and somehow you're still not sure if it's working.
>
> Here's what actually matters: how much did you spend, and how many clients retained? Divide one by the other. That number should go down every quarter.
>
> What does your firm actually measure Google Ads against?

---

## Implementation Timeline

| Week | Milestone |
|------|-----------|
| 1 | Domain setup, Vercel project, GitHub repo, brand voice calibration |
| 2 | Site build, content engine, social API connections |
| 3 | SEO infrastructure, location pages, lead magnet, launch |
| Post-launch | Daily automation running, first monthly report at Day 30 |

---

*Kenzsys Firm Content OS — built on enterprise AI infrastructure, operated for your firm, owned by you.*
