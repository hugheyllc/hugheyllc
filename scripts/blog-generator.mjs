#!/usr/bin/env node
/**
 * Blog Generator — Claude Sonnet
 * Generates blog drafts with Claude, stores in /drafts/ for approval
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const DRAFTS_DIR = path.join(ROOT, 'drafts');

if (!fs.existsSync(DRAFTS_DIR)) {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.log(JSON.stringify({
    status: 'failed',
    error: 'Missing ANTHROPIC_API_KEY',
    timestamp: new Date().toISOString()
  }, null, 2));
  process.exit(1);
}

// Topics to generate (includes DeepSeek rewrites with original dates)
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

function getRelatedPosts(keywords, limit = 4) {
  const keywordArray = keywords.split(/[,;]/).map(k => k.trim().toLowerCase()).filter(Boolean);
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  const candidates = [];
  
  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(content);
    const slug = path.basename(file, '.md');
    
    let score = 0;
    const titleLower = (data.title || '').toLowerCase();
    const tagsStr = ((data.tags || []).join(' ')).toLowerCase();
    
    for (const kw of keywordArray) {
      if (titleLower.includes(kw)) score += 3;
      if (tagsStr.includes(kw)) score += 2;
    }
    
    if (score > 0) {
      candidates.push({ slug, title: data.title || 'Untitled', score });
    }
  }
  
  return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
}

async function generateContent(topic) {
  const relatedPosts = getRelatedPosts(topic.keywords);
  const relatedLinks = relatedPosts
    .map(p => `- [${p.title}](/blog/${p.slug}/)`)
    .join('\n');
  
  const prompt = `You are Joe Hughey, a law firm marketing consultant writing for Hughey LLC's blog.

Write a blog post with this title and angle:

Title: "${topic.title}"
Keywords: ${topic.keywords}
Angle: ${topic.angle}

REQUIREMENTS:
1. AEO Answer (first 200 words): Start with 2-3 direct declarative sentences answering the main question
2. Length: 900-1,400 words
3. Inline links: Naturally embed 2-4 of these posts in the body:
${relatedLinks || '   (no related posts)'}
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
      
      console.error(`Generating: ${topic.title} (date: ${postDate})`);
      const content = await generateContent(topic);
      
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
        file: filename
      });
      
      console.error(`✅ Written: ${filename}`);
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
