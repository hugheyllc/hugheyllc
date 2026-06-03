# Daily Blog Process — Hughey LLC

Autonomous. No review required. Runs every day.

---

## Step 1: Pick the Post

Read `SEO_STRATEGY.md`. Find the next unwritten planned post in the content calendar table (Status: 🔲 Planned). Work through them in order.

When all planned posts are exhausted: pick the next logical topic from the priority keyword clusters in the same file. Never write outside the strategy.

Update the status to ✅ Published after posting.

---

## Step 2: Write to Spec

Every post must:

- **Open with an AEO answer** — the first 150–200 words directly answer 1–2 of the AEO target questions from `SEO_STRATEGY.md`, in plain declarative sentences an AI system can extract
- **Hit the target keyword** — use it naturally in the H1, first paragraph, and 2–3 times in the body
- **Inline internal links** — 2–4 links to existing posts, embedded within the body text (not just a footer list). Use descriptive anchor text.
- **End with a CTA** — link to `/contact/` in the final paragraph or a closing note
- **Related posts** — 2 links at the very bottom in the `*Related:*` format
- **No fabricated content** — no made-up client names, firm names, case studies, or specific statistics. Use "a common pattern," "firms that do this typically see," or "in accounts I've reviewed" language only.
- **Length:** 900–1,400 words

Frontmatter required fields:
```yaml
title:
slug:
date: YYYY-MM-DD
author: "Joe Hughey"
excerpt:        # 1–2 sentences, used in cards and meta
tags: []
seo_title:      # same as title unless a better keyword fit exists
seo_description: # 150–155 chars, includes target keyword
draft: false
image: "/images/blog/[slug].jpg"
```

---

## Step 3: Generate the Image

Use OpenAI `gpt-image-1` model. The prompt must reference the specific topic and angle of the post — not just the title.

**Prompt formula:**
```
[2–3 sentence description of what the post is about and its central tension or theme].
Visual style: very dark near-black background, subtle warm gold accent lighting, minimalist sophisticated law firm business context, no text or words anywhere in the image, dramatic professional editorial lighting, widescreen 3:2 composition.
```

**Example (for a post about firms firing agencies):**
> "A professional office environment where a formal business relationship is ending — tension between two parties, documents on a table, a sense of transition and accountability. Visual style: very dark near-black background, subtle warm gold accent lighting..."

Save to: `public/images/blog/[slug].jpg`

---

## Step 4: Commit and Push to Main

```bash
git add src/content/blog/[slug].md public/images/blog/[slug].jpg
git commit -m "feat: [Month D] blog post — [Title]"
git push origin dev
git push origin dev:main
```

---

## Step 5: Notify Joe

Send one Telegram message — nothing else:

> **"[Post Title]"**
> hugheyllc.com/blog/[slug]/

No recap. No "here's what I did." Title and URL only.

---

## What Never Changes

- Write every day. No skipping.
- Strategy file is the only source of truth for topics.
- If the planned queue runs out, extend it — don't improvise randomly.
- Internal links must be inline, not just footer.
- Image must relate to post content, not just be generic.
