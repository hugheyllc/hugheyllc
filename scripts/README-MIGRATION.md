# WordPress to Astro Blog Migration

This script automates the migration of WordPress blog posts to Astro markdown files in the `src/content/blog/` directory.

## Prerequisites

- Your WordPress XML export file (usually obtained from WordPress Admin → Tools → Export)
- The project dependencies are already installed: `fast-xml-parser` handles XML parsing

## Setup

### 1. Export Your WordPress Blog

1. Log into your WordPress admin dashboard
2. Go to **Tools** → **Export**
3. Select "Posts" under "Choose what to export"
4. Click **Download Export File**
5. Save the file as `export.xml`

### 2. Place the Export File

Move your `export.xml` file to:
```
scripts/import/export.xml
```

## Running the Migration

Execute the migration script:

```bash
node scripts/migrate-wp.mjs
```

### What the Script Does

1. **Reads** the WordPress XML export from `scripts/import/export.xml`
2. **Validates** the export format and file existence
3. **Filters** posts by:
   - Status = "publish" (skips drafts, scheduled posts)
   - Type = "post" (skips pages)
   - Has a non-empty slug
4. **Extracts** for each post:
   - Title
   - Slug (used as filename)
   - Publication date (converted to YYYY-MM-DD)
   - Excerpt (max 160 chars, HTML stripped)
   - Content (HTML converted to Markdown)
   - Tags (from post_tag categories)
5. **Generates** Astro-compatible frontmatter with all required fields:
   - `title`: Post title
   - `slug`: URL slug
   - `date`: Publication date (ISO format)
   - `author`: "Joe Hughey" (hardcoded)
   - `excerpt`: Short description for previews
   - `tags`: Array of post tags
   - `seo_title`: SEO page title (same as title)
   - `seo_description`: SEO meta description (same as excerpt)
   - `draft`: false (all published posts)
6. **Writes** markdown files to `src/content/blog/[slug].md`
7. **Logs** progress with creation and skip statistics

### Migration Output

Console output shows:
- ✓ Successfully created posts
- ⊘ Skipped posts (with reasons: status, type, empty slug)
- ✨ Final summary with total counts

### Content Conversion

**HTML → Markdown:**
- Heading tags (h2, h3, h4) → # Markdown headings
- Paragraphs → Plain text separated by blank lines
- Bold/strong tags → **text**
- Italic/emphasis tags → *text*
- Lists (ul/ol) → Markdown bullets and numbers
- Removes WordPress shortcodes ([caption], [gallery], etc.)
- Removes inline styles and class attributes
- Preserves paragraph structure and line breaks

## Example Output

When you run the script with posts, you'll see:

```
Starting WordPress to Astro migration...

⊘ Skipped: draft-post-example (status: draft)
✓ Created: blog/how-to-improve-law-firm-marketing.md
✓ Created: blog/seo-tips-for-attorneys.md
✓ Created: blog/client-intake-automation.md

✨ Migration complete: 3 posts created, 1 skipped
```

## Generated Markdown File Example

```markdown
---
title: "How to Improve Law Firm Marketing"
slug: "how-to-improve-law-firm-marketing"
date: 2024-03-15
author: "Joe Hughey"
excerpt: "Discover proven strategies for improving your law firm's marketing results..."
tags: ["marketing", "law-firms", "strategy"]
seo_title: "How to Improve Law Firm Marketing"
seo_description: "Discover proven strategies for improving your law firm's marketing results..."
draft: false
---

Your converted markdown content here...
```

## Verification

After migration, verify in your browser:

1. Run `npm run dev` to start the dev server
2. Visit `http://localhost:4321/blog`
3. Check that:
   - All migrated posts appear in the blog grid
   - Posts are sorted by date (newest first)
   - Draft posts are filtered out
   - Individual post pages are accessible at `/blog/[slug]`
   - Post metadata (title, excerpt, date, author) displays correctly

## Troubleshooting

**"Export file not found"**
- Ensure `scripts/import/export.xml` exists
- Check the file path is correct

**"Invalid WordPress export format"**
- Verify the XML file is valid (open it in a text editor)
- Check that it contains WordPress post data

**No posts migrated**
- Verify your WordPress export contains published posts (not drafts)
- Check that posts have non-empty slugs in WordPress

## Notes

- The script only migrates published posts. Draft posts are skipped.
- Author is hardcoded to "Joe Hughey" for all posts.
- Tags are extracted from WordPress post tags (post_tag category).
- Dates are converted to ISO format (YYYY-MM-DD).
- HTML content is converted to clean Markdown with proper structure.

EOF
