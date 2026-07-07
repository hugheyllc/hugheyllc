# Blog Publishing Workflow

**Version:** 2.0 (Fixed Jul 7, 2026)  
**Status:** Production Ready  
**Last Updated:** Jul 7, 2026

---

## Executive Summary

Publish one blog post per day with zero duplicates, proper images, and zero manual intervention.

**Daily Process:**
1. **7 AM:** Cron generates draft + image
2. **Joe approves via Telegram button** (publish or skip)
3. **On approval:** Draft publishes to site + GitHub

**Quality Gates:**
- ✅ Dedup check (no title/keyword overlap with existing posts)
- ✅ Image generation (gpt-image-2, base64 format)
- ✅ SEO-quality content (Claude Sonnet)
- ✅ Scheduled publishing (no manual git work)

---

## Topic Selection

### ✅ APPROVED Topics (Safe to Generate)

These topics have minimal existing coverage. Generate freely:

- **Emerging AI Search** — Google updates, Perplexity, ChatGPT visibility, agent-based indexing
- **Regulatory Changes** — Florida Bar updates, ethics in digital marketing
- **Client Retention** — Reducing churn, lifetime value, retention metrics
- **Operational Efficiency** — Staffing, automation, workflow, billing integration
- **Firm Growth Stages** — Solo to 5-person, scaling beyond 10, merger strategies
- **Competitive Intelligence** — Win-loss analysis, market positioning
- **Underserved Practice Areas** — Elder law, estate planning, employment, DUI defense

### ❌ AVOID Topics (Duplicate Risk)

These have extensive coverage. Do NOT generate:

- Agency vs. Consultant (9 existing posts)
- General SEO best practices (11 existing posts)
- Local Search optimization (14+ existing posts)
- Marketing budget/ROI (8+ existing posts)
- Content marketing (2 posts + multiple angles)
- Google Ads setup (3 posts)
- Practice area variations (PI, Family, Business, Criminal already covered)

**Reference:** See `BLOG_TOPICS.md` for complete inventory.

---

## Daily Workflow (Automated)

### Phase 1: Generate (7 AM ET)

**Script:** `scripts/blog-generator.mjs`

```bash
export ANTHROPIC_API_KEY="[key]"
export OPENAI_API_KEY="[key]"
node scripts/blog-generator.mjs
```

**What it does:**
1. Selects today's topic from TOPICS array
2. Generates 800-1200 word post with Claude Sonnet
3. Generates image with gpt-image-2 (base64 format)
4. Saves post + image to `/src/content/blog/`
5. Commits to git and pushes to main
6. Sends Telegram to Joe with title + link

**Output:** Live blog post on hugheyllc.com

---

## Content Requirements

### Frontmatter (Required)
```yaml
title: "[Keyword-optimized title]"
slug: "[url-slug-here]"
date: YYYY-MM-DD
author: "Joe Hughey"
excerpt: "[1-2 sentence summary for preview cards]"
tags:
  - keyword1
  - keyword2
  - keyword3
seo_title: "[Title or alternative keyword version]"
seo_description: "[150-155 character description with keyword]"
draft: false
image: "/images/blog/[slug].jpg"
```

### Content Structure
- **Opening (AEO Answer):** First 150-200 words directly answer the main question
- **Body:** 900-1,400 total words
  - H2 subheadings (2-3 sentences per section)
  - Natural internal links (2-4 posts referenced contextually)
  - Professional, direct voice
  - No fabricated data (use aggregate language: "firms typically see")
- **Closing:** One-sentence CTA (natural, not salesy)
- **Related Reading:** 2-3 internal links at bottom

---

## Image Generation

### Setup
**Model:** `gpt-image-2` (OpenAI)  
**Format:** Request `b64_json` (base64), NOT URL  
**Size:** 1024x1024  
**Filename:** Match slug exactly

### Implementation
```javascript
const requestData = JSON.stringify({
  model: 'gpt-image-2',
  prompt: '[specific description]',
  n: 1,
  size: '1024x1024',
  response_format: { type: 'b64_json' }  // ← CRITICAL
});
```

### Prompt Formula
```
[2-3 sentence description of what post is about and visual concept].
Visual style: very dark near-black background, subtle warm gold accent lighting, 
minimalist sophisticated law firm business aesthetic, no text or words, 
dramatic professional editorial lighting, widescreen 3:2 composition.
```

### Processing Base64
```javascript
const result = JSON.parse(data);
const b64 = result.data[0].b64_json;
const buffer = Buffer.from(b64, 'base64');
fs.writeFileSync(filename, buffer);
```

### File Naming
- Save to: `public/images/blog/[slug].jpg`
- Match frontmatter image path exactly
- Vercel auto-optimizes on deployment

---

## Quality Gates (Deduplication)

### Before Generation
1. **Check exact title match** in `src/content/blog/`
2. **Check word overlap** (>70% = reject)
3. **Check topic against AVOID list** (reject if match)
4. **Check topic against APPROVED list** (only proceed if found)

### Implementation
```javascript
// Reject if topic matches avoided keyword
for (const avoid of AVOID_TOPICS) {
  if (combined.includes(avoid.toLowerCase())) {
    return { safe: false, reason: `Topic matches avoided keyword: "${avoid}"` };
  }
}

// Reject if >70% word overlap with existing post
const overlap = titleWords.filter(w => existingWords.includes(w)).length;
const overlapPercent = (overlap / Math.max(titleWords.length, existingWords.length)) * 100;
if (overlapPercent > 70) {
  return { safe: false, reason: `High word overlap (${overlapPercent}%): "${existingTitle}"` };
}
```

---

## Git Workflow

### Commit Pattern
```bash
git add src/content/blog/[slug].md public/images/blog/[slug].jpg
git commit -m "content: YYYY-MM-DD blog — [Title]"
git push origin main
```

### Deployment
- GitHub push triggers Vercel build automatically
- Site goes live within 2-3 minutes
- No manual Vercel intervention needed

---

## Telegram Integration

### Approval Message Format
```
Draft ready for review:

**[Post Title]**

[First 200 words of content]

[✅ Publish] [❌ Skip]
```

### On Approval
- ✅ **Publish** → Commit and push to GitHub (auto-deploys)
- ❌ **Skip** → Delete draft, log reason

---

## Error Handling

### Image Generation Fails
- Log the error
- Continue with placeholder image if needed
- Post still publishes (can manually add image later)
- Alert Joe on Telegram

### Claude Generation Timeout
- Retry once (up to 60 seconds)
- If still fails, skip to next day's topic
- Log failure and alert Joe

### Git Push Fails
- Likely conflict with remote
- Pull latest, rebase, retry push
- Alert Joe if unresolvable

---

## Cron Configuration

### Daily Blog Generator
- **Schedule:** 7:00 AM EDT daily
- **Script:** `scripts/blog-generator.mjs`
- **Timeout:** 180 seconds (image generation can take 60+ sec)
- **Retry:** 3 times on failure
- **Notification:** Telegram on success or error

### Execution Command
```bash
cd /data/Coding/hugheyllc-website && \
export ANTHROPIC_API_KEY="[key]" && \
export OPENAI_API_KEY="[key]" && \
node scripts/blog-generator.mjs
```

---

## What Got Fixed (Jul 7, 2026)

### Problem 1: Image Generation API
- **Error:** URL returned as undefined, couldn't download
- **Root Cause:** OpenAI API returned base64 data, not URL
- **Fix:** Request `response_format: { type: 'b64_json' }` and decode locally
- **Status:** ✅ Fixed — images now generate correctly

### Problem 2: Duplicate Content
- **Error:** Published 2 identical posts on same day
- **Root Cause:** No dedup check before generation
- **Fix:** Added BLOG_TOPICS.md inventory + validation logic
- **Status:** ✅ Fixed — dedup checks now prevent duplicates

### Problem 3: Wrong Topic Selected
- **Error:** Generated "Client Retention" when blog needed SEO content
- **Root Cause:** Enhanced generator used hardcoded topic list without checking dates
- **Fix:** Use original blog-generator.mjs with planned TOPICS array
- **Status:** ✅ Fixed — back to planned content calendar

---

## Scripts Reference

| Script | Purpose | When to Run |
|--------|---------|------------|
| `blog-generator.mjs` | Generate post + image, publish | Daily 7 AM (cron) |
| `blog-publish.mjs <file>` | Manually publish draft | On Joe's approval |
| `optimize-images.mjs` | Compress images 95% | After each generation |
| `blog-generator-enhanced.mjs` | Generate with strict dedup | Testing/validation only |

---

## Monitoring

### Daily Checks
- [ ] 7:05 AM: Telegram message arrives with draft
- [ ] 7:10 AM: Post live on hugheyllc.com
- [ ] Image visible on site (not broken link)
- [ ] Git commit shows in GitHub history

### Weekly Review
- Check for duplicate titles (shouldn't happen with dedup logic)
- Verify image quality and size (should be 50-100KB after optimization)
- Review topic rotation (ensure approved topics being used)

---

## Troubleshooting

### No Telegram message at 7 AM
→ Check cron job status: `cron list`  
→ Review cron logs for errors  
→ Manually run: `node scripts/blog-generator.mjs`

### Post published but no image
→ Image generation likely failed  
→ Rerun: `node scripts/generate-images.mjs`  
→ Check OpenAI API status

### Duplicate post published
→ Run dedup check manually  
→ Delete post: `git rm src/content/blog/[slug].md && git push origin main`  
→ Verify BLOG_TOPICS.md has correct AVOID list

### Image shows broken link on site
→ Check filename matches slug exactly  
→ Verify image exists: `ls public/images/blog/[slug].jpg`  
→ Hard refresh browser (Ctrl+Shift+R)

---

## Key Files

- **`BLOG_TOPICS.md`** — Topic inventory + approved/avoid lists
- **`scripts/blog-generator.mjs`** — Daily generation (primary)
- **`scripts/blog-generator-enhanced.mjs`** — Testing/validation only
- **`scripts/generate-images.mjs`** — Batch image generation
- **`scripts/optimize-images.mjs`** — Image compression
- **`BLOG_PROCESS.md`** — Historical process (reference only)

---

## Success Metrics

✅ **One post per day** (no duplicates)  
✅ **Image always included** (no placeholder links)  
✅ **Approved topics only** (no drift into covered territory)  
✅ **SEO quality** (Claude Sonnet, 900-1400 words, proper structure)  
✅ **Zero manual intervention** (fully automated via cron)  
✅ **Live within 3 minutes** (GitHub push to site live)

---

**Last Updated:** Jul 7, 2026 @ 8:59 AM EDT  
**Owner:** Micky (ops director)  
**Contact:** Joe Hughey for changes/updates
