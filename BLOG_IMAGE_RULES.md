# Blog Image Generation Rules — IMMUTABLE

**These rules are locked. Any deviation is a failure.**

## Rule 1: Model Selection
- ✅ **ONLY** use `gpt-image-1`
- ❌ Do NOT use dall-e-3, gpt-4o-mini, or any other model
- ❌ Do NOT try alternate models if the first fails

## Rule 2: API Parameters
```javascript
{
  model: 'gpt-image-1',
  prompt: `${customPrompt}. ${STYLE}`,
  n: 1,
  size: '1536x1024'
}
```
- ✅ Size MUST be `1536x1024` (widescreen)
- ❌ Do NOT use other sizes (1024x1024, 1792x1024, etc.)
- ❌ Do NOT add `response_format` parameter (gpt-image-1 returns b64_json automatically)

## Rule 3: Style Constant
**EXACT text:**
```
Very dark near-black background. Subtle warm gold accent lighting. Minimalist sophisticated law firm business context. No text, no words, no letters anywhere in the image. Dramatic professional editorial lighting. Widescreen composition.
```
- ✅ Copy this exactly for every image
- ❌ Do NOT paraphrase, shorten, or modify

## Rule 4: Rate Limiting
```javascript
await sleep(6000); // Between requests
```
- ✅ Sleep 6 seconds between OpenAI calls (~10 requests/minute, well under limit)
- ❌ Do NOT skip the sleep
- ❌ Do NOT reduce sleep time

## Rule 5: Output Format
- ✅ Save as `.jpg` to `/public/images/blog/[slug].jpg`
- ✅ Use base64 decode: `Buffer.from(b64, 'base64')`
- ❌ Do NOT save as `.png`
- ❌ Do NOT try to convert formats

## Rule 6: Frontmatter Update
- ✅ Add `image: "/images/blog/[slug].jpg"` after `draft:` line
- ✅ Only if not already present (skip if exists)
- ❌ Do NOT add duplicate image entries

## Rule 7: Error Handling
- ✅ Catch and log errors
- ✅ Continue to next file on error
- ✅ Exit with code 1 if any errors occurred
- ❌ Do NOT ignore errors silently
- ❌ Do NOT try workarounds

## Rule 8: Process Flow
1. Read markdown files from BLOG_DIR
2. Extract slug and title from frontmatter
3. Check if image already exists (skip if yes)
4. Generate prompt: `Abstract editorial image representing: {title}. Law firm marketing, business strategy, and professional growth context.`
5. Call generateImage() with gpt-image-1
6. Save base64 to JPG
7. Update frontmatter
8. Sleep 6000ms
9. Continue next file or exit

---

## Testing Compliance

Before every deployment:
```bash
# Verify script has gpt-image-1 only
grep -c "gpt-image-1" scripts/generate-missing-blog-images.mjs  # Should be 2+
grep "dall-e\|gpt-4o" scripts/generate-missing-blog-images.mjs    # Should be 0

# Verify response_format is NOT in POST body
grep -c "response_format" scripts/generate-missing-blog-images.mjs # Should be 0-1 (only comment allowed)

# Verify sleep is present
grep "sleep(6000)" scripts/generate-missing-blog-images.mjs        # Should exist

# Verify STYLE is exact
grep "Very dark near-black background" scripts/generate-missing-blog-images.mjs
```

---

## When in Doubt

**Reference:** `/data/Coding/hugheyllc-website/scripts/generate-missing-blog-images.mjs`

This file is the SOURCE OF TRUTH. If anything in this doc contradicts the script, the script wins.

Before writing any image generation code, copy the working script and modify ONLY the prompt variable.
