#!/usr/bin/env node
// Daily content workflow for hugheyllc.com.
// Picks a topic, writes a blog post, generates an image, posts to Twitter
// and LinkedIn, notifies Joe on Telegram, updates SEO_STRATEGY.md.
// Self-contained: no npm dependencies.

import https from 'node:https';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const IMAGE_DIR = path.join(ROOT, 'public/images/blog');
const STRATEGY_FILE = path.join(ROOT, 'SEO_STRATEGY.md');
const PROCESS_FILE = path.join(ROOT, 'BLOG_PROCESS.md');

const IMAGE_STYLE =
  'Very dark near-black background. Subtle warm gold accent lighting. Minimalist sophisticated law firm business context. No text, no words, no letters anywhere in the image. Dramatic professional editorial lighting. Widescreen 3:2 composition.';

// ---------- HTTP ----------

function request(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({ status: res.statusCode, headers: res.headers, body: buf });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ---------- Anthropic ----------

async function callAnthropic({ system, user, maxTokens = 4096 }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  const body = JSON.stringify({
    model: 'claude-haiku-4-5',
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const res = await request(
    {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    },
    body,
  );
  if (res.status !== 200) {
    throw new Error(`Anthropic ${res.status}: ${res.body.toString('utf8').slice(0, 500)}`);
  }
  const json = JSON.parse(res.body.toString('utf8'));
  const text = json.content?.map((c) => c.text || '').join('') || '';
  if (!text) throw new Error('Anthropic returned empty text');
  return text;
}

// ---------- OpenAI image ----------

async function generateImage(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  const body = JSON.stringify({
    model: 'gpt-image-1',
    prompt: `${prompt} ${IMAGE_STYLE}`,
    n: 1,
    size: '1536x1024',
  });
  const res = await request(
    {
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    body,
  );
  if (res.status !== 200) {
    throw new Error(`OpenAI ${res.status}: ${res.body.toString('utf8').slice(0, 500)}`);
  }
  const json = JSON.parse(res.body.toString('utf8'));
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error(`OpenAI image response missing b64_json: ${JSON.stringify(json).slice(0, 300)}`);
  return Buffer.from(b64, 'base64');
}

// ---------- Blog data ----------

function listBlogFiles() {
  return fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!mm) continue;
    let val = mm[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    out[mm[1]] = val;
  }
  return out;
}

function collectExistingPosts() {
  const files = listBlogFiles();
  return files.map((f) => {
    const content = fs.readFileSync(path.join(BLOG_DIR, f), 'utf8');
    const fm = parseFrontmatter(content);
    return {
      file: f,
      slug: fm.slug || path.basename(f, '.md'),
      title: fm.title || '',
      tags: fm.tags || '',
      excerpt: fm.excerpt || '',
    };
  });
}

// ---------- SEO strategy ----------

function readStrategy() {
  return fs.readFileSync(STRATEGY_FILE, 'utf8');
}

function findNextPlannedPost(strategy) {
  // Match rows like: | 6 | Title | keyword | angle | 🔲 Planned |
  const lines = strategy.split('\n');
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    if (!line.includes('🔲')) continue;
    const cells = line.split('|').map((c) => c.trim());
    // cells[0] is empty from leading |
    // Expect: '', '#', 'Title', 'Target Keyword', 'Angle', 'Status', ''
    if (cells.length < 6) continue;
    const [, num, title, keyword, angle, status] = cells;
    if (!status.includes('🔲')) continue;
    return { rowLine: line, num, title, keyword, angle };
  }
  return null;
}

function pickFallbackTopic(strategy, existing) {
  // Mine cluster bullets when no planned posts remain.
  const lines = strategy.split('\n');
  const candidates = [];
  let inClusters = false;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      inClusters = line.includes('Priority Keyword Clusters');
      continue;
    }
    if (!inClusters) continue;
    const m = line.match(/^-\s+([a-z][^\n]+)$/i);
    if (m && !m[1].toLowerCase().startsWith('rationale')) {
      candidates.push(m[1].trim());
    }
  }
  const existingTitles = existing.map((p) => p.title.toLowerCase()).join(' \n ');
  const fresh = candidates.find((c) => !existingTitles.includes(c.toLowerCase()));
  const keyword = fresh || candidates[0] || 'law firm marketing consultant';
  return {
    rowLine: null,
    num: null,
    title: null,
    keyword,
    angle: 'Practical guidance, accountability framing',
  };
}

function markPlannedAsPublished(strategy, rowLine, finalTitle) {
  if (!rowLine) return strategy;
  const updated = rowLine.replace('🔲 Planned', '✅ Published');
  return strategy.replace(rowLine, updated);
}

// ---------- Slug ----------

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ---------- Blog post generation ----------

async function generateBlogPost({ plannedTitle, keyword, angle, existing }) {
  const processSpec = fs.readFileSync(PROCESS_FILE, 'utf8');
  const existingList = existing
    .map((p) => `- ${p.title} — /blog/${p.slug}/`)
    .join('\n');
  const today = new Date().toISOString().slice(0, 10);

  const system = `You are Joe Hughey, an independent law firm marketing consultant in Tampa Bay with 20+ years of experience. You write direct, no-fluff posts grounded in real operating experience. You never fabricate client names, firm names, case studies, or specific statistics. You use language like "a common pattern," "firms that do this typically see," or "in accounts I've reviewed." Voice is conversational but expert.`;

  const user = `Write a complete blog post for hugheyllc.com following the spec exactly.

# Spec
${processSpec}

# Today's date
${today}

# Topic
${plannedTitle ? `Planned title: ${plannedTitle}\n` : ''}Target keyword: ${keyword}
Angle: ${angle}

# Existing posts (for internal linking and to avoid duplication)
${existingList}

# Output format
Return ONLY the full Markdown file content. Start with the YAML frontmatter (between --- fences) and end with the related posts footer. No commentary before or after.

Required frontmatter fields:
- title: a strong, specific title (string, double-quoted)
- slug: kebab-case slug (string, double-quoted)
- date: ${today}
- author: "Joe Hughey"
- excerpt: 1-2 sentence excerpt (double-quoted)
- tags: a YAML array of 3-5 tag strings
- seo_title: SEO title (double-quoted)
- seo_description: 150-155 chars, includes target keyword (double-quoted)
- draft: false
- image: "/images/blog/SLUG.jpg" (use the same slug you put above)

Body requirements:
- First 150-200 words directly answer 1-2 AEO questions in plain declarative sentences
- Hit target keyword in H1, first paragraph, and 2-3 times in body
- 2-4 inline internal links to existing posts above, with descriptive anchor text. Use markdown links like [anchor](/blog/slug-here/). Embed them in body sentences, not as a list.
- 900-1400 words
- Final paragraph CTA links to /contact/
- End with a "### Related Reading" section containing exactly 2 markdown links to existing posts (full URLs https://hugheyllc.com/blog/slug/)
- No fabricated names, firms, case studies, or specific numeric statistics`;

  const text = await callAnthropic({ system, user, maxTokens: 8192 });
  // Strip leading fences if model wrapped in ```markdown
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n/, '').replace(/\n```\s*$/, '');
  }
  if (!cleaned.startsWith('---')) {
    throw new Error(`Generated post does not start with frontmatter: ${cleaned.slice(0, 200)}`);
  }
  const fm = parseFrontmatter(cleaned);
  if (!fm.title || !fm.slug) {
    throw new Error('Generated post missing title or slug in frontmatter');
  }
  return { content: cleaned, fm };
}

// ---------- Social copy ----------

async function generateTweet({ title, slug, excerpt }) {
  const system =
    'You write punchy, plain-English social posts for Joe Hughey, an independent law firm marketing consultant. No emojis, no hashtags, no clickbait. Direct, declarative, useful.';
  const user = `Write a single tweet (max 200 characters, no trailing URL — I will append it) about this new blog post.

Title: ${title}
Excerpt: ${excerpt}

Return only the tweet text — no quotes, no commentary, no hashtags.`;
  const text = (await callAnthropic({ system, user, maxTokens: 300 })).trim();
  const cleaned = text.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').slice(0, 200);
  return `${cleaned}\n\nhugheyllc.com/blog/${slug}/`;
}

const LINKEDIN_STRUCTURES = [
  {
    name: 'Contrarian Take',
    spec: `Bold opening that challenges a common belief (1 line). Blank line. 2-3 supporting points, each its own short paragraph (1-2 sentences). Blank line. A nuance or honest caveat (1-2 sentences). Blank line. A direct invitation to push back. 150-300 words.`,
  },
  {
    name: 'Story to Lesson',
    spec: `A narrative hook in the first 1-2 lines (something a law firm owner has actually seen). Blank line. Set up the conflict in 2-3 short paragraphs. Blank line. Resolution — what changed when they fixed it. Blank line. The takeaway in plain language. Blank line. A specific question to the reader. 200-400 words.`,
  },
  {
    name: 'Numbered Framework',
    spec: `A short hook (1-2 lines) naming the problem. Blank line. 3-7 numbered items. Each item starts with a number and short label on its own line, then a 1-2 sentence explanation underneath. Blank line between items. End with a single-sentence CTA. 150-250 words.`,
  },
  {
    name: 'Question Post',
    spec: `1-3 sentence setup that frames the problem in concrete terms. Blank line. A direct, specific question to law firm owners (not generic, not engagement bait). 50-100 words total.`,
  },
];

async function generateLinkedInPost({ title, slug, excerpt, structureIndex = 0 }) {
  const structure = LINKEDIN_STRUCTURES[structureIndex % LINKEDIN_STRUCTURES.length];
  const system = `You write LinkedIn posts for Joe Hughey, an independent law firm marketing consultant in Tampa Bay with 20+ years of experience. Voice: direct, plain English, no corporate speak, no AI cliches ("dive in", "unlock", "leverage", "game-changer"), no emojis except a single optional pointer like 👇 at the end of a "link in comments" line. Speak to law firm owners and managing partners. Never fabricate client names, firm names, case studies, or specific statistics — say "firms that do this typically see" or "a common pattern" instead.`;

  const user = `Write a LinkedIn post about this blog post using the "${structure.name}" structure.

Structure spec:
${structure.spec}

Hard formatting rules — these are not optional:
- One thought per line. Blank line between paragraphs.
- The first line must be a standalone hook that works without the rest of the post: either a counterintuitive claim ("The best law firm websites have almost no text...") or a direct address ("If your law firm is doing X without Y, you're burning cash."). It must hook before LinkedIn truncates at ~210 characters.
- NO URL anywhere in the post body. Do not mention hugheyllc.com. End the post with the line: Full breakdown in comments 👇   (or: Link in first comment 👇)
- Place the CTA at the end, never in the middle.
- After the CTA line, add a blank line, then 3-5 hashtags on a single line: #LawFirmMarketing #LegalMarketing plus 2-3 broader relevant tags (e.g., #SmallBusiness, #Entrepreneurship, #DigitalMarketing, #SEO, #GoogleAds — pick what fits the topic).
- No engagement bait ("agree?", "thoughts?", "comment below if..."). A genuine specific question is fine.

Topic context (for your reference only — do not paste these in):
Title: ${title}
Excerpt: ${excerpt}

Return only the post text. No quotes around it. No commentary before or after.`;

  const text = (await callAnthropic({ system, user, maxTokens: 1200 })).trim();
  let cleaned = text.replace(/^["']|["']$/g, '');
  // Strip any URL the model snuck in
  cleaned = cleaned.replace(/https?:\/\/\S+/g, '').replace(/hugheyllc\.com\/blog\/[\w-]+\/?/g, '');
  // Collapse runs of 3+ blank lines down to 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}

// ---------- Twitter OAuth 1.0a ----------

function pctEncode(s) {
  return encodeURIComponent(s).replace(
    /[!*'()]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

function oauth1Header({ method, url, bodyParams = {}, oauth }) {
  const params = {
    oauth_consumer_key: oauth.consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: oauth.accessToken,
    oauth_version: '1.0',
    ...bodyParams,
  };
  const paramString = Object.keys(params)
    .sort()
    .map((k) => `${pctEncode(k)}=${pctEncode(params[k])}`)
    .join('&');
  const base = `${method.toUpperCase()}&${pctEncode(url)}&${pctEncode(paramString)}`;
  const signingKey = `${pctEncode(oauth.consumerSecret)}&${pctEncode(oauth.accessTokenSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(base).digest('base64');

  const headerParams = {
    oauth_consumer_key: oauth.consumerKey,
    oauth_nonce: params.oauth_nonce,
    oauth_signature: signature,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: params.oauth_timestamp,
    oauth_token: oauth.accessToken,
    oauth_version: '1.0',
  };
  const headerStr = Object.keys(headerParams)
    .sort()
    .map((k) => `${pctEncode(k)}="${pctEncode(headerParams[k])}"`)
    .join(', ');
  return `OAuth ${headerStr}`;
}

async function postTweet(text) {
  const oauth = {
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN_V1,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  };
  if (!oauth.consumerKey || !oauth.consumerSecret || !oauth.accessToken || !oauth.accessTokenSecret) {
    throw new Error('Twitter OAuth 1.0a credentials missing');
  }
  // Use v1.1 with form-encoded body (v2 requires elevated API access tier)
  const url = 'https://api.twitter.com/1.1/statuses/update.json';
  const qs = await import('node:querystring').then(m => m.default);
  const bodyParams = { status: text };
  const auth = oauth1Header({ method: 'POST', url, bodyParams, oauth });
  const body = qs.stringify(bodyParams);
  const res = await request(
    {
      hostname: 'api.twitter.com',
      path: '/1.1/statuses/update.json',
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    body,
  );
  const responseText = res.body.toString('utf8');
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Twitter ${res.status}: ${responseText.slice(0, 500)}`);
  }
  const json = JSON.parse(responseText);
  return json.data?.id;
}

// ---------- LinkedIn ----------

async function postLinkedIn(text) {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = process.env.LINKEDIN_PERSON_URN;
  if (!token || !personUrn) throw new Error('LinkedIn credentials missing');
  const author = personUrn.startsWith('urn:li:person:') ? personUrn : `urn:li:person:${personUrn}`;
  const body = JSON.stringify({
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  });
  const res = await request(
    {
      hostname: 'api.linkedin.com',
      path: '/v2/ugcPosts',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    body,
  );
  const responseText = res.body.toString('utf8');
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`LinkedIn ${res.status}: ${responseText.slice(0, 500)}`);
  }
  return res.headers['x-restli-id'] || JSON.parse(responseText).id;
}

async function commentLinkedIn(postUrn, text) {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = process.env.LINKEDIN_PERSON_URN;
  if (!token || !personUrn || !postUrn) throw new Error('LinkedIn comment prerequisites missing');
  const actor = personUrn.startsWith('urn:li:person:') ? personUrn : `urn:li:person:${personUrn}`;
  const fullPostUrn = postUrn.startsWith('urn:li:') ? postUrn : `urn:li:share:${postUrn}`;
  const encodedUrn = encodeURIComponent(fullPostUrn);
  const body = JSON.stringify({
    actor,
    object: fullPostUrn,
    message: { text },
  });
  const res = await request(
    {
      hostname: 'api.linkedin.com',
      path: `/v2/socialActions/${encodedUrn}/comments`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    body,
  );
  const responseText = res.body.toString('utf8');
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`LinkedIn comment ${res.status}: ${responseText.slice(0, 500)}`);
  }
}

// ---------- Telegram ----------

async function notifyTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('Telegram credentials missing');
  const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' });
  const res = await request(
    {
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    body,
  );
  const responseText = res.body.toString('utf8');
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Telegram ${res.status}: ${responseText.slice(0, 500)}`);
  }
}

// ---------- Main ----------

async function main() {
  console.log('[1/7] Loading existing posts and strategy');
  const existing = collectExistingPosts();
  console.log(`     found ${existing.length} existing posts`);

  // Check if a post was already published today (manually pushed before cron ran)
  const today = new Date().toISOString().slice(0, 10);
  const todayPost = existing.find((p) => p.date === today);
  if (todayPost) {
    console.log(`     today's post already exists: ${todayPost.slug} — skipping blog/image generation, posting social only`);
    const structureIndex = existing.length;
    console.log('[4/7] Posting to Twitter (today post already exists)');
    try {
      const tweet = await generateTweet({ title: todayPost.title, slug: todayPost.slug, excerpt: todayPost.excerpt });
      const tweetId = await postTweet(tweet);
      console.log(`     posted tweet id=${tweetId}`);
    } catch (e) {
      console.error(`     twitter failed: ${e.message}`);
    }
    console.log('[5/7] Posting to LinkedIn (today post already exists)');
    try {
      const liText = await generateLinkedInPost({ title: todayPost.title, slug: todayPost.slug, excerpt: todayPost.excerpt, structureIndex });
      const liId = await postLinkedIn(liText);
      console.log(`     posted linkedin id=${liId}`);
      try {
        await commentLinkedIn(liId, `Full breakdown: hugheyllc.com/blog/${todayPost.slug}/`);
        console.log('     posted first-comment URL');
      } catch (cErr) {
        console.error(`     linkedin first-comment failed: ${cErr.message}`);
      }
    } catch (e) {
      console.error(`     linkedin failed: ${e.message}`);
    }
    console.log('[6/7] Notifying Joe on Telegram');
    try {
      await notifyTelegram(`**${todayPost.title}**\nhugheyllc.com/blog/${todayPost.slug}/`);
    } catch (e) {
      console.error(`     telegram failed: ${e.message}`);
    }
    console.log(`\nDone (social-only): ${todayPost.title}`);
    return;
  }

  let strategy = readStrategy();
  let planned = findNextPlannedPost(strategy);
  if (planned) {
    console.log(`     next planned post: ${planned.title} (keyword: ${planned.keyword})`);
  } else {
    planned = pickFallbackTopic(strategy, existing);
    console.log(`     no planned posts left — fallback keyword: ${planned.keyword}`);
  }

  // Duplicate check — hard stop if slug already exists
  const existingTitles = existing.map((p) => p.title.toLowerCase());
  const existingSlugs = new Set(existing.map((p) => p.slug));
  // Pre-check: if planned slug already in repo, skip entirely and pick next topic
  const plannedSlug = planned.title
    ? planned.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : '';
  if (existingSlugs.has(plannedSlug)) {
    throw new Error(`SLUG_EXISTS: planned topic slug "${plannedSlug}" already published. Cron should pick a different topic next run.`);
  }
  if (planned.title && existingTitles.some((t) => t === planned.title.toLowerCase())) {
    throw new Error(`TITLE_EXISTS: planned title "${planned.title}" already published.`);
  }

  console.log('[2/7] Generating blog post via Anthropic');
  const { content, fm } = await generateBlogPost({
    plannedTitle: planned.title,
    keyword: planned.keyword,
    angle: planned.angle,
    existing,
  });
  let slug = fm.slug;
  if (existingSlugs.has(slug)) {
    throw new Error(`SLUG_COLLISION: generated slug "${slug}" already exists in repo. Topic was already published.`);
  }
  const postPath = path.join(BLOG_DIR, `${slug}.md`);
  fs.writeFileSync(postPath, content, 'utf8');
  console.log(`     wrote ${postPath}`);

  console.log('[3/7] Generating blog image via OpenAI');
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
  const imagePrompt = `Editorial image representing: "${fm.title}". The post explores: ${planned.angle}. Topic: ${planned.keyword}. Capture the central tension visually without text.`;
  const imageBuf = await generateImage(imagePrompt);
  const imagePath = path.join(IMAGE_DIR, `${slug}.jpg`);
  fs.writeFileSync(imagePath, imageBuf);
  console.log(`     wrote ${imagePath} (${imageBuf.length} bytes)`);

  // Steps 4–6: social. Failures here are non-fatal.
  console.log('[4/7] Posting to Twitter');
  try {
    const tweet = await generateTweet({ title: fm.title, slug, excerpt: fm.excerpt });
    const tweetId = await postTweet(tweet);
    console.log(`     posted tweet id=${tweetId}`);
  } catch (e) {
    console.error(`     twitter failed: ${e.message}`);
  }

  console.log('[5/7] Posting to LinkedIn');
  try {
    // Rotate post structure by existing post count so back-to-back posts vary
    const structureIndex = existing.length;
    const liText = await generateLinkedInPost({
      title: fm.title,
      slug,
      excerpt: fm.excerpt,
      structureIndex,
    });
    const liId = await postLinkedIn(liText);
    console.log(`     posted linkedin id=${liId} (structure: ${LINKEDIN_STRUCTURES[structureIndex % LINKEDIN_STRUCTURES.length].name})`);
    // Post the blog URL as the first comment so it doesn't kill reach.
    try {
      await commentLinkedIn(liId, `Full breakdown: hugheyllc.com/blog/${slug}/`);
      console.log('     posted first-comment URL');
    } catch (cErr) {
      console.error(`     linkedin first-comment failed: ${cErr.message}`);
    }
  } catch (e) {
    console.error(`     linkedin failed: ${e.message}`);
  }

  console.log('[6/7] Notifying Joe on Telegram');
  try {
    await notifyTelegram(`**${fm.title}**\nhugheyllc.com/blog/${slug}/`);
    console.log('     telegram sent');
  } catch (e) {
    console.error(`     telegram failed: ${e.message}`);
  }

  console.log('[7/7] Updating SEO_STRATEGY.md');
  if (planned.rowLine) {
    const updated = markPlannedAsPublished(strategy, planned.rowLine, fm.title);
    if (updated !== strategy) {
      fs.writeFileSync(STRATEGY_FILE, updated, 'utf8');
      console.log('     marked planned row as ✅ Published');
    } else {
      console.log('     strategy row not modified');
    }
  } else {
    console.log('     no planned row to update (fallback topic)');
  }

  console.log(`\nDone: ${fm.title}`);
  console.log(`     /blog/${slug}/`);
}

main().catch((err) => {
  console.error(`FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
