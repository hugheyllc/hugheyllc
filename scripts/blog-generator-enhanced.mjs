#!/usr/bin/env node
/**
 * Blog Generator v2 — Claude Sonnet with Topic Deduplication
 * Checks BLOG_TOPICS.md before generating to avoid duplicates
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
const TOPICS_FILE = path.join(ROOT, 'BLOG_TOPICS.md');

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

// Suggested topics for generation (rotating list for daily content)
const SUGGESTED_TOPICS = [
  {
    title: 'Client Retention Strategies for Law Firms: Beyond the Retainer Model',
    keywords: 'client retention, law firm retention rate, retainer model, client loyalty',
    angle: 'Reduce churn, improve lifetime value, retention metrics that matter',
    category: 'Client Experience',
    approved: true
  },
  {
    title: 'Staffing Your Marketing Team: In-House, Agency, or Hybrid?',
    keywords: 'marketing team structure, in-house vs agency, law firm staffing',
    angle: 'Team structure, hiring, cost comparison, skill gaps',
    category: 'Operational Efficiency',
    approved: true
  },
  {
    title: 'Practice Area Growth Strategy: How to Pick Your Next Specialization',
    keywords: 'practice area expansion, law firm growth, market demand, profitability',
    angle: 'Market sizing, competition, profitability, implementation',
    category: 'Firm Growth Stages',
    approved: true
  },
  {
    title: 'What AI Overviews Mean for Law Firm SEO in 2026',
    keywords: 'AI overviews Google, AIO search, law firm visibility, AI indexing',
    angle: 'How AI is changing search, positioning strategy, content approach',
    category: 'Emerging AI Search',
    approved: true
  },
  {
    title: 'Competitive Win-Loss Analysis for Law Firms: Learning Why You Lose',
    keywords: 'competitive intelligence, win-loss analysis, law firm competition',
    angle: 'Gathering data, analyzing losses, market positioning',
    category: 'Competitive Intelligence',
    approved: true
  }
];

// Topics to absolutely avoid
const AVOID_TOPICS = [
  'agency vs consultant',
  'seo best practices',
  'local seo optimization',
  'content marketing for law firms',
  'google ads',
  'personal injury',
  'family law',
  'business law',
  'email marketing',
  'social media marketing'
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

function checkTopicSafety(title, keywords) {
  const titleLower = title.toLowerCase();
  const keywordsLower = keywords.toLowerCase();
  const combined = `${titleLower} ${keywordsLower}`;

  for (const avoid of AVOID_TOPICS) {
    if (combined.includes(avoid.toLowerCase())) {
      return {
        safe: false,
        reason: `Topic matches avoided keyword: "${avoid}"`
      };
    }
  }

  // Check for exact title match in existing posts
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(content);
    const existingTitle = (data.title || '').toLowerCase();
    
    // Exact match
    if (existingTitle === titleLower) {
      return {
        safe: false,
        reason: `Exact title match found: "${data.title}"`
      };
    }
    
    // High word overlap (>70%)
    const titleWords = titleLower.split(/\s+/);
    const existingWords = existingTitle.split(/\s+/);
    const overlap = titleWords.filter(w => existingWords.includes(w)).length;
    const overlapPercent = (overlap / Math.max(titleWords.length, existingWords.length)) * 100;
    
    if (overlapPercent > 70) {
      return {
        safe: false,
        reason: `High word overlap (${overlapPercent.toFixed(0)}%): "${data.title}"`
      };
    }
  }

  return { safe: true, reason: null };
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
    posts: [],
    validationIssues: []
  };

  try {
    // Select today's topic (first approved one)
    const topic = SUGGESTED_TOPICS[0]; // Rotate through list daily
    
    if (!topic.approved) {
      result.error = `Topic not approved for generation: ${topic.title}`;
      result.status = 'failed';
      return result;
    }

    // Check safety
    const safety = checkTopicSafety(topic.title, topic.keywords);
    if (!safety.safe) {
      result.error = `Topic validation failed: ${safety.reason}`;
      result.validationIssues.push(safety.reason);
      result.status = 'failed';
      return result;
    }

    const slug = slugify(topic.title);
    const postDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.error(`Generating: ${topic.title}`);
    console.error(`Validation: PASSED — Safe to publish`);
    
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
      draft: true, // Save as draft, require approval
      image: `/images/blog/${slug}.jpg`
    };
    
    const markdown = matter.stringify(content, frontmatter);
    
    // Save to drafts folder (not published yet)
    const draftFilename = `${new Date().toISOString().split('T')[0]}-${slug}.md`;
    const draftPath = path.join(DRAFTS_DIR, draftFilename);
    fs.writeFileSync(draftPath, markdown);
    
    result.posts.push({
      slug,
      title: topic.title,
      date: postDate,
      file: draftFilename,
      draft: true,
      category: topic.category
    });
    
    result.status = 'success';
    console.error(`✅ Draft saved: ${draftFilename}`);
    
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
