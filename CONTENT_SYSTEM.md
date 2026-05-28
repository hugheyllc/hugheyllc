# Content System — Hughey LLC

*Last updated: 2026-05-28*

## How to Add New Posts

### File Naming
- Lowercase, hyphenated: `topic-name-here.md`
- Place in `src/content/blog/`
- Slug should match filename (without `.md`)

### Frontmatter Schema
```yaml
---
title: "Full Post Title"
slug: "url-slug-matching-filename"
date: YYYY-MM-DD
author: "Joe Hughey"
excerpt: "1-2 sentence summary for previews and meta descriptions"
tags: ["keyword-tag-1", "keyword-tag-2"]
seo_title: "SEO-optimized title (can differ from display title)"
seo_description: "Meta description, 150-160 chars, includes target keyword"
draft: false
---
```

### Writing Guidelines
- Joe Hughey's voice: authoritative, direct, practical, no fluff
- 800-1,200 words per post
- Include target keyword in first paragraph
- Answer an AEO question in the first 200 words (declarative, extractable by AI)
- Link to at least 2 existing posts or pages
- End with a CTA linking to `/contact`
- No stock photo language, no corporate jargon

---

## Content Calendar — Next 8 Posts

| # | Title | Target Keyword | Publish Target |
|---|-------|---------------|---------------|
| 1 | How to Calculate Your True Cost Per Retained Client | cost per retained client law firm | Week of Jun 2 |
| 2 | 10 Questions to Ask Before Hiring a Law Firm Marketing Agency | questions to ask law firm marketing agency | Week of Jun 9 |
| 3 | Why Law Firms Fire Their Marketing Agency | switch law firm marketing agency | Week of Jun 16 |
| 4 | FindLaw and Martindale: Are Directory Listings Still Worth It? | FindLaw alternatives law firms | Week of Jun 23 |
| 5 | Personal Injury Marketing in Tampa Bay: What Actually Drives Cases | personal injury marketing Tampa Bay | Week of Jun 30 |
| 6 | How Much Should a Law Firm Spend on Marketing in 2026? | law firm marketing budget | Week of Jul 7 |
| 7 | Family Law Marketing Strategy: Beyond the Billboard | family law marketing strategy | Week of Jul 14 |
| 8 | Why Your Law Firm's Marketing Reports Are Lying to You | law firm marketing reports | Week of Jul 21 |

---

## Competitor Monitoring Cadence

- **Monthly:** Review competitor SERPs for target keywords, note ranking changes
- **Quarterly:** Update COMPETITORS.md with positioning changes, new content gaps
- **Ongoing:** If a competitor launches a major campaign or new content, note in COMPETITORS.md

---

## AEO Optimization Checklist (Per Post)

- [ ] First 200 words contain a clear, declarative answer to an AEO question
- [ ] Target keyword appears in title, first paragraph, and at least one H2
- [ ] Post answers a question from SEO_STRATEGY.md AEO targets list
- [ ] Sentences are structured for AI extraction (subject-verb-object, no ambiguity)
- [ ] FAQ section included where natural (bonus: FAQ schema markup)
- [ ] Author attribution is clear (Person schema support)

---

## Autonomous Content Production (Kenz)

Kenz (the AI agent) will produce and push content to `dev` on a weekly basis:

### Weekly Workflow
1. Check CONTENT_SYSTEM.md for the next planned post
2. Review COMPETITORS.md for relevant competitor intelligence
3. Review SEO_STRATEGY.md for keyword targets and AEO questions
4. Draft the post following the writing guidelines and frontmatter schema
5. Run the AEO optimization checklist
6. Commit to `dev` branch: `git commit -m "feat: add blog post [slug]"`
7. Push to `dev` — Vercel preview auto-deploys for Joe's review
8. Update this calendar (mark post as published, add next planned post)

### Rules
- Never push directly to `main` — all content goes to `dev` for preview
- Joe reviews the Vercel preview URL and merges to `main` when approved
- If a planned topic needs Joe's input (e.g., specific client anecdote), skip it and write the next one
- Keep posts factual and defensible — no claims that can't be backed up
