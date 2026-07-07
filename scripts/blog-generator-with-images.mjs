#!/usr/bin/env node
/**
 * Blog Generator — Claude Sonnet + OpenAI Images + Auto-Optimize
 * Generates blog drafts, images, optimizes immediately, publishes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import https from 'https';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const IMAGES_DIR = path.join(ROOT, 'public/images/blog');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!ANTHROPIC_API_KEY || !OPENAI_API_KEY) {
  console.log(JSON.stringify({
    status: 'failed',
    error: 'Missing ANTHROPIC_API_KEY or OPENAI_API_KEY',
    timestamp: new Date().toISOString()
  }, null, 2));
  process.exit(1);
}

// Topics to generate (planned content calendar)
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

  try {
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
      throw new Error(`${response.status} - ${err.error?.message || JSON.stringify(err)}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (e) {
    throw new Error('Content generation failed: ' + e.message);
  }
}

async function generateImage(slug, topic) {
  return new Promise((resolve, reject) => {
    const prompt = `Professional law office environment depicting the concept of "${topic.angle}". Visual showing the key challenge or opportunity. Dark sophisticated background with gold accents, minimalist law firm aesthetic, no text or words, dramatic professional editorial lighting, widescreen 3:2 composition.`;

    const requestData = JSON.stringify({
      model: 'gpt-image-2',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: { type: 'b64_json' }
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      },
      timeout: 120000
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            const b64 = result.data[0].b64_json;

            if (b64) {
              const buffer = Buffer.from(b64, 'base64');
              const filename = path.join(IMAGES_DIR, `${slug}.jpg`);
              fs.writeFileSync(filename, buffer);
              console.error(`✅ Image generated: ${slug}.jpg (${(buffer.length / 1024).toFixed(0)}KB)`);
              resolve(filename);
            } else {
              throw new Error('No base64 data in response');
            }
          } catch (e) {
            reject(new Error('Failed to parse image response: ' + e.message));
          }
        } else {
          reject(new Error(`API error ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error('Image generation request failed: ' + e.message));
    });

    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('Image generation timeout (120s)'));
    });

    req.write(requestData);
    req.end();
  });
}

async function optimizeImage(filename) {
  try {
    const statBefore = fs.statSync(filename);
    const sizeBefore = statBefore.size / 1024;

    await sharp(filename)
      .resize(1024, 1024, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 50, progressive: true })
      .toFile(filename + '.tmp');

    fs.renameSync(filename + '.tmp', filename);

    const statAfter = fs.statSync(filename);
    const sizeAfter = statAfter.size / 1024;
    const reduction = ((1 - sizeAfter / sizeBefore) * 100).toFixed(0);

    console.error(`✅ Image optimized: ${sizeBefore.toFixed(0)}KB → ${sizeAfter.toFixed(0)}KB (${reduction}% reduction)`);
  } catch (e) {
    console.error(`⚠️  Image optimization failed: ${e.message}`);
  }
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

      console.error(`\n📝 Generating: ${topic.title}`);

      // Generate content
      const content = await generateContent(topic);

      // Generate and optimize image
      let imageGenerated = false;
      try {
        const imagePath = await generateImage(slug, topic);
        await optimizeImage(imagePath);
        imageGenerated = true;
      } catch (imgErr) {
        console.error(`⚠️  Image generation failed: ${imgErr.message}`);
        // Continue without image
      }

      // Create frontmatter
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

      // Write blog post
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

      console.error(`✅ Post written: ${filename}`);
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
