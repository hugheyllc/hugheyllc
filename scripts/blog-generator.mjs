#!/usr/bin/env node
/**
 * Blog Generator — Claude Sonnet
 * Generates blog drafts from approved queue, prevents duplicates, stores in /drafts/ for approval
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const DRAFTS_DIR = path.join(ROOT, 'drafts');
const BLOG_QUEUE_FILE = path.join(ROOT, 'BLOG_TOPIC_QUEUE.md');

if (!fs.existsSync(DRAFTS_DIR)) {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

/**
 * Check if a post with similar title already exists
 */
function checkDuplicate(title) {
  const slug = slugify(title);
  
  // Check exact file match in blog directory
  if (fs.existsSync(path.join(BLOG_DIR, `${slug}.md`))) {
    return { isDuplicate: true, reason: 'Exact slug match exists in published' };
  }
  
  // Check git history for this slug
  try {
    const gitLog = execSync(`cd ${ROOT} && git log --all --oneline -- "src/content/blog/${slug}.md" 2>/dev/null`, { encoding: 'utf-8' });
    if (gitLog.trim()) {
      return { isDuplicate: true, reason: 'Found in git history' };
    }
  } catch (e) {
    // No match in git, continue
  }
  
  // Check title similarity (>80% match on key words)
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    try {
      const filePath = path.join(BLOG_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(content);
      const existingTitle = (data.title || '').toLowerCase();
      const newTitle = title.toLowerCase();
      
      // Check if titles are very similar (same slug or >80% word overlap)
      const newWords = new Set(newTitle.split(/\W+/).filter(w => w.length > 3));
      const existingWords = new Set(existingTitle.split(/\W+/).filter(w => w.length > 3));
      
      if (newWords.size > 0 && existingWords.size > 0) {
        const intersection = [...newWords].filter(w => existingWords.has(w));
        const similarity = intersection.length / Math.max(newWords.size, existingWords.size);
        
        if (similarity > 0.75) {
          return { 
            isDuplicate: true, 
            reason: `Similar to: "${data.title}"`,
            existingFile: file
          };
        }
      }
    } catch (e) {
      // Skip this file if error
    }
  }
  
  return { isDuplicate: false };
}

/**
 * Parse next uncommented topic from BLOG_TOPIC_QUEUE.md
 * Format: "N. Topic Title"
 */
function getNextTopic() {
  if (!fs.existsSync(BLOG_QUEUE_FILE)) {
    console.error(`Queue file not found: ${BLOG_QUEUE_FILE}`);
    return null;
  }
  
  const content = fs.readFileSync(BLOG_QUEUE_FILE, 'utf8');
  const lines = content.split('\n');
  
  // Find first uncommented, non-published topic line
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip headers, comments, empty lines
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---') || trimmed.startsWith('**')) {
      continue;
    }
    
    // Match pattern: "N. Topic Title"
    const match = trimmed.match(/^\d+\.\s+(.+?)(?:\s*\(.*?\))?$/);
    if (match) {
      const topicTitle = match[1].trim();
      
      // Skip if line contains "(Published" or "✅"
      if (line.includes('Published') || line.includes('✅')) {
        continue;
      }
      
      return {
        title: topicTitle,
        keywords: topicTitle.toLowerCase().split(/[,;]/).filter(k => k.length > 2),
        angle: 'Practical insights for law firm growth and marketing effectiveness',
        date: new Date().toISOString().split('T')[0]
      };
    }
  }
  
  return null;
}

/**
 * Mark topic as used in queue by adding check mark
 */
function markTopicUsed(topic) {
  const content = fs.readFileSync(BLOG_QUEUE_FILE, 'utf8');
  const lines = content.split('\n');
  
  const updated = lines.map(line => {
    const trimmed = line.trim();
    const match = trimmed.match(/^\d+\.\s+(.+?)(?:\s*\(.*?\))?$/);
    
    if (match && match[1].trim() === topic.title && !line.includes('Published')) {
      // Add publication marker
      return line + ` (Published ${topic.date})`;
    }
    return line;
  }).join('\n');
  
  fs.writeFileSync(BLOG_QUEUE_FILE, updated);
}

function getRelatedPosts(keywords, limit = 4) {
  const keywordArray = keywords.slice(0, 5).map(k => k.toLowerCase()).filter(k => k.length > 2);
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  const candidates = [];
  
  for (const file of files) {
    try {
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
    } catch (e) {
      // Skip file on error
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

Write a blog post with this title:

Title: "${topic.title}"

REQUIREMENTS:
1. AEO Answer (first 200 words): Start with 2-3 direct sentences answering the main question
2. Length: 900-1,400 words
3. Inline links: Naturally embed 2-3 of these posts in the body if relevant:
${relatedLinks || '   (no related posts)'}
4. Structure: Use H2 subheadings, keep paragraphs 2-3 sentences
5. Voice: Direct, professional, practical — no fluff
6. Tone: Authoritative but conversational
7. Ending: One sentence CTA
8. Data: No fabricated metrics — use aggregate language ("many firms", "in my experience")

Write ONLY the body content (no frontmatter, no title, no markdown heading).`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
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
    topic: null,
    duplicate: false,
    post: null
  };

  try {
    // Get next topic from queue
    const topic = getNextTopic();
    if (!topic) {
      result.status = 'failed';
      result.error = 'No unprocessed topics in queue';
      return result;
    }
    
    result.topic = topic.title;
    
    // Check for duplicates BEFORE generating
    const dupCheck = checkDuplicate(topic.title);
    if (dupCheck.isDuplicate) {
      result.status = 'skipped';
      result.duplicate = true;
      result.error = `Duplicate detected: ${dupCheck.reason}`;
      markTopicUsed(topic); // Still mark as processed
      return result;
    }
    
    console.error(`Generating: ${topic.title}`);
    const content = await generateContent(topic);
    
    // Generate slug and prepare frontmatter
    const slug = slugify(topic.title);
    const postDate = topic.date;
    
    const excerpt = topic.title.substring(0, 155);
    const frontmatter = {
      title: topic.title,
      slug,
      date: postDate,
      author: 'Joe Hughey',
      excerpt,
      tags: topic.keywords.slice(0, 5),
      seo_title: topic.title,
      seo_description: excerpt,
      draft: false,
      image: `/images/blog/${slug}.jpg`
    };
    
    const markdown = matter.stringify(content, frontmatter);
    const filename = `${postDate}-${slug}.md`;
    const filepath = path.join(DRAFTS_DIR, filename);
    fs.writeFileSync(filepath, markdown);
    
    // Mark as used in queue
    markTopicUsed(topic);
    
    result.status = 'success';
    result.post = {
      slug,
      title: topic.title,
      date: postDate,
      file: filename,
      draftPath: filepath
    };
    
    console.error(`✅ Draft created: ${filename}`);
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
