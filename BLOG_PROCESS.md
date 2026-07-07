# Daily Blog Process — Hughey LLC

**Current Status:** 3-Phase Approval Workflow (Draft → Approve → Publish)  
**Last Updated:** Jul 7, 2026  
**Change Log:** Added mandatory deduplication checks to prevent duplicate content

---

## ⚠️ Duplicate Content Prevention (CRITICAL)

**Issue Found (Jul 7, 2026):** 119 blog posts included multiple duplicates:
- "30-minute-marketing-audit" posted twice with identical titles
- "Agency vs. Consultant" covered in 9 separate posts
- "SEO Best Practices" covered in 11 posts
- Many geographic variations of the same core content

**Current Solution:** All topic proposals are checked against `BLOG_TOPICS.md` inventory.

**RULES:**
1. **Check `BLOG_TOPICS.md`** before proposing any new topic
2. **Avoid topics** listed in the "AVOID (Duplicate Risk)" section
3. **Only generate topics** in the "Approved New Topics (2026)" section
4. **No geographic variations** of the same content (FL location posts are complete)
5. **No practice area variations** beyond existing coverage (PI, Family, Business, Criminal already covered)

**Key File:** `BLOG_TOPICS.md` — this is the source of truth for topic approval.

---

## 3-Phase Workflow

### Phase 1: Generate Draft (7 AM ET, Automated)

`scripts/blog-generator.mjs` runs daily at 7 AM:

1. **Select topic** from approved list in `BLOG_TOPICS.md`
2. **Run dedup checks:**
   - Check exact title matches in `src/content/blog/`
   - Check for >70% word overlap
   - Check against "AVOID" keywords list
   - If any check fails → skip this topic, use next approved topic
3. **Generate content** with Claude Sonnet (800–1200 words)
4. **Generate image** with gpt-image-2 (OpenAI)
5. **Save to `/drafts/` folder** with timestamp prefix (not published yet)
6. **Send Telegram message** to Joe with draft preview + "✅ Publish" / "❌ Skip" buttons

**Script:** `scripts/blog-generator.mjs`  
**Environment:** Requires `ANTHROPIC_API_KEY` + `OPENAI_API_KEY`  
**Cron Job:** "Daily Blog Generator (7 AM - Claude)" (ID: `2442fcbb-0e88-4a55-afc4-917f2b936c21`)

---

### Phase 2: Manual Approval (Joe Reviews)

Joe receives Telegram message at 7 AM with:
- **Post title** and slug
- **Draft preview** (first 300 words)
- **Two buttons:**
  - ✅ **Publish** → moves draft to published folder, commits, pushes to GitHub
  - ❌ **Skip** → deletes draft, notes reason in SEO_STRATEGY.md

**No changes allowed during approval** — if Joe needs rewrites, he skips it and asks for a new draft.

---

### Phase 3: Publish (On Joe's Approval)

When Joe clicks "✅ Publish":

1. Move draft from `/drafts/` → `src/content/blog/`
2. Generate thumbnail image (gpt-image-2) if not already created
3. Optimize image for web (95% compression)
4. Commit: `git commit -m "content: [Date] blog — [Title]"`
5. Push to GitHub main branch
6. Vercel auto-deploys
7. Send confirmation to Joe: "Published: [Title]"

**Script:** `scripts/blog-publish.mjs <draft-filename>`  
**Result:** Post live on hugheyllc.com within 2-3 minutes

---

## Manual Post Submission (Alternative Workflow)

If Joe wants to **manually post** content from `/drafts/`:

```bash
cd /data/Coding/hugheyllc-website
node scripts/blog-publish.mjs 2026-07-08-sample-post.md
```

This publishes the draft and pushes to GitHub.

---

## Topic Selection Rules

### ✅ APPROVED Topics (Safe to Generate)

These topics are covered minimally and won't create duplicates:

- Emerging AI Search (Google updates, Perplexity, agent-based indexing)
- Regulatory Changes (Florida Bar updates, ethics)
- Client Retention & Experience
- Operational Efficiency (staffing, automation, workflow)
- Firm Growth Stages (solo to 5-person, scaling, mergers)
- Competitive Intelligence (win-loss analysis, positioning)
- Underserved Practice Areas (elder law, estate planning, employment, DUI)

### ⛔ AVOID Topics (Duplicate Risk)

These topics are already covered extensively. **DO NOT** generate:

- Agency vs. Consultant comparisons (9 posts)
- General SEO best practices (11 posts)
- Local Search optimization (14+ posts)
- Marketing budget/ROI basics (8+ posts)
- Content marketing for law firms (2 posts + multiple angles)
- Google Ads setup (3 posts)
- Personal injury / Family law / Business law marketing (already covered by practice area)

**If you feel one of these needs updating:** Consolidate or rewrite existing posts instead of creating new ones.

---

## Frontmatter Template

Every published post requires:

```yaml
title: "[Post Title]"
slug: "[url-slug-here]"
date: YYYY-MM-DD
author: "Joe Hughey"
excerpt: "[1-2 sentence summary for card preview]"
tags: 
  - keyword1
  - keyword2
seo_title: "[Keyword-optimized title, often same as title]"
seo_description: "[150-155 character description]"
draft: false
image: "/images/blog/[slug].jpg"
```

---

## Image Generation

Every post gets a thumbnail image generated via gpt-image-2.

**Script:** `scripts/generate-images.mjs`  
**Quality:** High-quality, law-firm-appropriate visuals  
**Format:** JPG, optimized to 50-100KB for web  
**Location:** `public/images/blog/[slug].jpg`

---

## Post Structure Requirements

### Opening (AEO Answer)
- First 150–200 words directly answer the main question
- 2-3 declarative sentences AI systems can extract
- No fluff, no intro narrative

### Body
- Use target keyword naturally (H1, first paragraph, 2-3x in body)
- 2-4 internal links embedded contextually (not footer lists)
- H2 subheadings, short paragraphs (2-3 sentences max)
- Professional tone, direct voice
- No fabricated data — use aggregate language ("firms typically see," "in accounts I've reviewed")

### Length
- 900–1,400 words

### Closing
- One-sentence CTA (natural, not salesy)
- Link to relevant resource or /contact/

---

## Files to Monitor

- **`BLOG_TOPICS.md`** — Source of truth for approved topics
- **`SEO_STRATEGY.md`** — Historical content calendar (reference only)
- **`src/content/blog/`** — Published posts (119+ total)
- **`drafts/`** — Pending approval
- **`scripts/blog-generator.mjs`** — Daily auto-generation
- **`scripts/blog-publish.mjs`** — Publishing on approval

---

## Cron Jobs

| Job | Schedule | Behavior |
|-----|----------|----------|
| Daily Blog Generator | 7 AM ET | Generate draft, send to Telegram |
| Blog Health Monitor | 2 PM ET | Check if draft published, alert if stuck |

Both jobs are in OpenClaw's cron scheduler.

---

## Git Workflow

```bash
# Generate and publish (manual)
node scripts/blog-generator.mjs        # Creates draft in /drafts/
node scripts/blog-publish.mjs [file]   # Moves to published, commits

# Optimize and commit
node scripts/optimize-images.mjs       # Compress all images 95%
git add src/content/blog/ public/images/blog/
git commit -m "content: [Date] blog — [Title]"
git push origin main
```

---

## Cleanup Checklist

- [ ] Remove duplicate "30-minute-marketing-audit-agency-dashboard" (keep the older one)
- [ ] Fix missing frontmatter on 3 posts (lawyer-keyword-research, mobile-first-indexing, the-seo-graveyard)
- [ ] Consider consolidating 9 agency comparison posts into 3-4 definitive guides
- [ ] Audit geographic variants for unnecessary duplication

---

## Questions?

Refer to `BLOG_TOPICS.md` for topic inventory or ask Joe.
