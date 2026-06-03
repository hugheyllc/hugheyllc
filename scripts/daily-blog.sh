#!/bin/bash
# Daily blog post generator — runs at 8am ET via VPS cron
# Follows BLOG_PROCESS.md exactly

set -e
REPO_DIR="/data/Coding/hugheyllc-website"
LOG_FILE="/var/log/hugheyllc-daily-blog.log"
cd "$REPO_DIR"

echo "=== Daily blog run: $(date) ===" >> "$LOG_FILE"

# Pull latest before writing
git pull origin main --quiet >> "$LOG_FILE" 2>&1

# Set OpenAI key from Vercel (already in env from .env.local or export below)
export OPENAI_API_KEY=$(grep "OPENAI_API_KEY" "$REPO_DIR/.env.local" 2>/dev/null | cut -d= -f2)

# Run Claude Code to execute the full blog process
RESULT=$(claude --permission-mode bypassPermissions --print "
You are executing the daily blog post process for hugheyllc.com. Follow BLOG_PROCESS.md exactly. The repo is at $REPO_DIR.

STEP 0 — Duplicate check:
Read all frontmatter titles and slugs in src/content/blog/. Confirm the chosen topic is not already covered at the same angle.

STEP 1 — Pick the post:
Read SEO_STRATEGY.md. Find the next entry with Status: 🔲 Planned in the content calendar table. If all are done, pick the next logical topic from the priority keyword clusters.
Update SEO_STRATEGY.md to mark the post ✅ Published once written.

STEP 2 — Write the post:
Follow all spec in BLOG_PROCESS.md: AEO answer in first 200 words, inline internal links to 2+ existing posts, CTA to /contact/, related posts footer, no fabricated content, 900–1400 words.
Save to src/content/blog/[slug].md with complete frontmatter.

STEP 3 — Generate the image:
Use OpenAI API. Key is in environment variable OPENAI_API_KEY.
API: POST https://api.openai.com/v1/images/generations
Model: gpt-image-1, size: 1536x1024, response_format: b64_json
Image prompt must describe the post's specific topic, angle, and central tension — not just the title.
End the prompt with: 'Visual style: very dark near-black background, subtle warm gold accent lighting, minimalist sophisticated law firm business context, no text or words anywhere in the image, dramatic professional editorial lighting, widescreen 3:2 composition.'
Decode the b64_json response and save to public/images/blog/[slug].jpg.

STEP 4 — Commit and push to main:
git add src/content/blog/[slug].md public/images/blog/[slug].jpg SEO_STRATEGY.md
git commit -m 'feat: [Month D] blog post — [Title]'
git push origin dev
git push origin dev:main

Print the final line exactly as: BLOG_COMPLETE:[slug]:[title]
" 2>> "$LOG_FILE")

echo "$RESULT" >> "$LOG_FILE"

# Extract slug and title from result
BLOG_LINE=$(echo "$RESULT" | grep "^BLOG_COMPLETE:" | tail -1)
SLUG=$(echo "$BLOG_LINE" | cut -d: -f2)
TITLE=$(echo "$BLOG_LINE" | cut -d: -f3-)

if [ -n "$SLUG" ]; then
  # Notify Joe via openclaw
  openclaw message send \
    --channel telegram \
    --to 8570648638 \
    --text "**${TITLE}**
hugheyllc.com/blog/${SLUG}/" >> "$LOG_FILE" 2>&1
  echo "Notification sent for $SLUG" >> "$LOG_FILE"
else
  echo "ERROR: No BLOG_COMPLETE line found in output" >> "$LOG_FILE"
  openclaw message send \
    --channel telegram \
    --to 8570648638 \
    --text "⚠️ Daily blog script ran but couldn't confirm completion. Check /var/log/hugheyllc-daily-blog.log" >> "$LOG_FILE" 2>&1
fi

echo "=== Done: $(date) ===" >> "$LOG_FILE"
