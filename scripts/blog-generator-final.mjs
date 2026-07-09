#!/usr/bin/env node
/**
 * Blog Generator — Production Ready
 * Claude Sonnet + OpenAI Images (fetch-based) + Auto-Optimize
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const IMAGES_DIR = path.join(ROOT, 'public/images/blog');

// Load API keys from env vars, or fall back to gateway config
function loadKeysFromGatewayConfig() {
  try {
    const configPath = '/data/.openclaw/openclaw.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const providers = config?.models?.providers || {};
    return {
      anthropic: providers?.anthropic?.apiKey,
      openai: providers?.openai?.apiKey
    };
  } catch (e) {
    return { anthropic: null, openai: null };
  }
}

const gatewayKeys = loadKeysFromGatewayConfig();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || gatewayKeys.anthropic;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || gatewayKeys.openai;

if (!ANTHROPIC_API_KEY || !OPENAI_API_KEY) {
  console.log(JSON.stringify({
    status: 'failed',
    error: 'Missing ANTHROPIC_API_KEY or OPENAI_API_KEY (checked env + gateway config)',
    timestamp: new Date().toISOString()
  }, null, 2));
  process.exit(1);
}

// Planned content calendar
const TOPICS = [
  {
    title: '7 Law Firm Marketing Agency Problems (And How to Avoid Them)',
    keywords: 'law firm marketing agency problems, agency mistakes, red flags',
    angle: 'Common failures, accountability gaps, what to watch for',
    date: '2026-07-02'
  },
  {
    title: 'Google Business Profile Optimization for Law Firms: Beyond the Basics',
    keywords: 'Google Business Profile law firms, GBP, local SEO',
    angle: 'Profile setup, review strategy, competitive advantage',
    date: '2026-07-02'
  },
  {
    title: 'The SEO Graveyard: Why Law Firm Websites Stop Ranking (And How to Resurrect Them)',
    keywords: 'law firm SEO drop, ranking recovery, website stagnation',
    angle: 'Causes, diagnosis framework, recovery tactics',
    date: '2026-07-03'
  },
  {
    title: 'Mobile-First Indexing and Law Firm Websites: Is Yours Actually Mobile-Friendly?',
    keywords: 'law firm mobile SEO, mobile-first indexing, responsive design',
    angle: 'Core Web Vitals, technical issues, mobile UX',
    date: '2026-07-04'
  }
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

async function generateContent(topic) {
  const prompt = `You are Joe Hughey, a law firm marketing consultant writing for Hughey LLC's blog.

Write a blog post with this title and angle:

Title: "${topic.title}"
Keywords: ${topic.keywords}
Angle: ${topic.angle}

REQUIREMENTS:
1. AEO Answer (first 200 words): Start with 2-3 direct declarative sentences answering the main question
2. Length: 900-1,400 words
3. Inline links: Naturally embed 2-4 of relevant posts in the body
4. Structure: H2 subheadings, short paragraphs (2-3 sentences)
5. Voice: Direct, professional, no fluff
6. Ending: One sentence CTA
7. No fabricated content: Use aggregate language only

Write ONLY body content (no frontmatter, no markdown title).`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`${response.status} - ${err.error?.message}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function generateImage(title, slug) {
  const prompt = `Professional illustration for a law firm marketing blog post titled "${title}". 
A sophisticated law office setting showing digital marketing strategy, data analysis, or client relationship concepts.
Visual style: very dark near-black background, subtle warm gold accent lighting, minimalist professional aesthetic, no text or words, dramatic editorial lighting, 3:2 widescreen composition.`;

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt,
      n: 1,
      size: '1024x1024'
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Image API error: ${response.status}`);
    return null;
  }

  const data = await response.json();
  
  let imgBuffer;
  if (data.data[0].url) {
    const imgResp = await fetch(data.data[0].url);
    if (!imgResp.ok) {
      console.error(`Image download failed: ${imgResp.status}`);
      return null;
    }
    imgBuffer = await imgResp.arrayBuffer();
  } else if (data.data[0].b64_json) {
    imgBuffer = Buffer.from(data.data[0].b64_json, 'base64');
  } else {
    console.error('Unexpected image response format');
    return null;
  }

  const imagePath = path.join(IMAGES_DIR, `${slug}.jpg`);
  fs.writeFileSync(imagePath, Buffer.from(imgBuffer));

  // Optimize immediately
  try {
    await sharp(imagePath)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 50, progressive: true })
      .toFile(imagePath + '.tmp');

    fs.renameSync(imagePath + '.tmp', imagePath);
  } catch (e) {
    console.error(`Optimization failed: ${e.message}`);
  }

  return `/images/blog/${slug}.jpg`;
}

async function generate() {
  const result = {
    timestamp: new Date().toISOString(),
    status: 'unknown',
    error: null,
    posts: []
  };

  try {
    for (const topic of TOPICS) {
      const slug = slugify(topic.title);
      const postDate = topic.date;

      console.error(`📝 Generating: ${topic.title}`);

      // Generate content
      const content = await generateContent(topic);

      // Generate image (with fallback)
      let imageGenerated = false;
      try {
        await generateImage(topic.title, slug);
        imageGenerated = true;
      } catch (imgErr) {
        console.error(`⚠️  Image generation failed: ${imgErr.message}`);
      }

      // Create post
      const excerpt = topic.title.substring(0, 155);
      const frontmatter = {
        title: topic.title,
        slug,
        date: postDate,
        author: 'Joe Hughey',
        excerpt,
        tags: topic.keywords.split(/[,;]/).map(k => k.trim()).filter(Boolean),
        seo_title: topic.title,
        seo_description: excerpt,
        draft: false,
        image: `/images/blog/${slug}.jpg`
      };

      const markdown = matter.stringify(content, frontmatter);
      const filename = `${slug}.md`;
      const filepath = path.join(BLOG_DIR, filename);
      fs.writeFileSync(filepath, markdown);

      result.posts.push({
        slug,
        title: topic.title,
        date: postDate,
        file: filename,
        imageGenerated
      });

      console.error(`✅ Post complete: ${filename}`);
    }

    result.status = 'success';
  } catch (e) {
    result.status = 'failed';
    result.error = e.message;
  }

  return result;
}

(async () => {
  const result = await generate();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'success' ? 0 : 1);
})();
