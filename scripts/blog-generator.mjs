#!/usr/bin/env node
/**
 * Blog Generator v2 — Improved
 * Enforces inline links requirement with clearer Claude prompt
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { execSync } from 'child_process';
import { validateTopic } from './validate-topic.mjs';

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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY');
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

function checkDuplicate(title) {
  const slug = slugify(title);
  
  if (fs.existsSync(path.join(BLOG_DIR, `${slug}.md`))) {
    return { isDuplicate: true, reason: 'Exact slug match exists in published' };
  }
  
  try {
    const gitLog = execSync(`cd ${ROOT} && git log --all --oneline -- "src/content/blog/${slug}.md" 2>/dev/null`, { encoding: 'utf-8' });
    if (gitLog.trim()) {
      return { isDuplicate: true, reason: 'Found in git history' };
    }
  } catch (e) {
    // No match in git
  }
  
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    try {
      const filePath = path.join(BLOG_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(content);
      const existingTitle = (data.title || '').toLowerCase();
      const newTitle = title.toLowerCase();
      
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
      // Skip
    }
  }
  
  return { isDuplicate: false };
}

function getNextTopic() {
  if (!fs.existsSync(BLOG_QUEUE_FILE)) {
    console.error(`Queue file not found: ${BLOG_QUEUE_FILE}`);
    return null;
  }
  
  const content = fs.readFileSync(BLOG_QUEUE_FILE, 'utf8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---') || trimmed.startsWith('**')) {
      continue;
    }
    
    const match = trimmed.match(/^\d+\.\s+(.+?)(?:\s*\(.*?\))?$/);
    if (match) {
      const topicTitle = match[1].trim();
      
      if (line.includes('Published') || line.includes('✅') || line.includes('SKIPPED')) {
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

function markTopicUsed(topic) {
  const content = fs.readFileSync(BLOG_QUEUE_FILE, 'utf8');
  const lines = content.split('\n');
  
  const updated = lines.map(line => {
    const trimmed = line.trim();
    const match = trimmed.match(/^\d+\.\s+(.+?)(?:\s*\(.*?\))?$/);
    
    if (match && match[1].trim() === topic.title && !line.includes('Published') && !line.includes('SKIPPED')) {
      return line + ` (Published ${topic.date})`;
    }
    return line;
  }).join('\n');
  
  fs.writeFileSync(BLOG_QUEUE_FILE, updated);
}

function getRelatedPosts(keywords, limit = 5) {
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
      // Skip
    }
  }
  
  return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
}

async function generateImage(title, slug) {
  const prompt = `Professional blog header image for "${title}" - a law firm marketing concept. Modern, clean design with business/legal context. High quality, suitable for blog header on professional law firm website.`;
  
  try {
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
      const err = await response.json();
      throw new Error(`${response.status} - ${err.error?.message || JSON.stringify(err)}`);
    }

    const data = await response.json();
    
    const imageDir = path.join(ROOT, 'public/images/blog');
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }
    const imagePath = path.join(imageDir, `${slug}.jpg`);
    
    if (data.data?.[0]?.b64_json) {
      const b64Data = data.data[0].b64_json;
      const imageBuffer = Buffer.from(b64Data, 'base64');
      fs.writeFileSync(imagePath, imageBuffer);
    } else if (data.data?.[0]?.url) {
      const imageUrl = data.data[0].url;
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
    } else {
      throw new Error(`Invalid response structure: ${JSON.stringify(data).substring(0, 200)}`);
    }
    
    return `/images/blog/${slug}.jpg`;
  } catch (e) {
    throw new Error('Image generation failed: ' + e.message);
  }
}

async function generateContent(topic) {
  const relatedPosts = getRelatedPosts(topic.keywords);
  
  // Build a formatted list of related posts for the prompt
  const relatedPostsList = relatedPosts
    .map((p, i) => `${i + 1}. [${p.title}](/blog/${p.slug}/)`)
    .join('\n');
  
  // Build prompt with STRICT inline link requirements
  const prompt = `You are Joe Hughey, a law firm marketing consultant with 20+ years of law firm marketing experience. Write a blog post with this title:

TITLE: "${topic.title}"

HARD REQUIREMENTS (non-negotiable):

1. OPENING SECTION (minimum 150-200 words):
   - Start with 2-3 sentences that directly answer the title as a question
   - This is the "AEO answer" - make it substantial and meaty
   - Don't rush to subheadings - spend real words on this opening

2. TOTAL LENGTH: 900-1,400 words

3. INLINE MARKDOWN LINKS (ABSOLUTELY REQUIRED - you MUST include 2-3):
   Available related articles:
${relatedPostsList}

   YOUR JOB: Weave 2-3 of these links DIRECTLY INTO your paragraphs as you write. Not at the end. Not in a "Related Posts" section. IN THE BODY.

   CORRECT EXAMPLES:
   "As I covered in depth in [Building an Internal Referral Program](/blog/building-an-internal-referral-program-law-firm/), your own team is often the best..."
   "This parallels what I explored in [Strategic Partnerships With Accountants](/blog/strategic-partnerships-with-accountants-financial-advisors/), where I showed that..."
   "I detailed this approach in [Thought Leadership on LinkedIn](/blog/legal-thought-leadership-on-linkedin/), but here's how it applies specifically..."

   AFTER YOU FINISH: Count the links in your response. There should be at least 2-3 markdown links in different sections of your body text.

4. STRUCTURE:
   - Use H2 subheadings (##)
   - Keep paragraphs 2-3 sentences
   - No Related Posts list at the bottom

5. VOICE:
   - Direct, professional, practical
   - Use "in my experience", "I've found", "from what I've seen"
   - Write from Joe's perspective as a law firm marketing expert

6. TONE: Authoritative but conversational. You're talking to law firm owners and marketing directors.

7. ENDING: One clear, direct call-to-action sentence

8. DATA: Use only aggregate language ("many firms", "most clients", "I've noticed"). Never fabricate metrics or specific percentages.

DO NOT INCLUDE:
- YAML frontmatter
- Title heading (we'll add it)
- Author byline
- "Related Posts" section

WRITE ONLY: The body content for the blog post.`;

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
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`${response.status} - ${err.error?.message || JSON.stringify(err)}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Verify inline links are present
    const linkCount = (content.match(/\[.+?\]\(\/blog\/.+?\//g) || []).length;
    if (linkCount < 2) {
      console.error(`WARNING: Generated content has only ${linkCount} inline links (expected 2-3). Content may not meet requirements.`);
    }
    
    return content;
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
    const topic = getNextTopic();
    if (!topic) {
      result.status = 'failed';
      result.error = 'No unprocessed topics in queue';
      return result;
    }
    
    result.topic = topic.title;
    
    const dupCheck = checkDuplicate(topic.title);
    if (dupCheck.isDuplicate) {
      result.status = 'skipped';
      result.duplicate = true;
      result.error = `Duplicate detected: ${dupCheck.reason}`;
      markTopicUsed(topic);
      return result;
    }
    
    const topicValidation = validateTopic(topic.title);
    if (topicValidation.status === 'rejected') {
      result.status = 'skipped';
      result.duplicate = true;
      result.error = `Topic validation failed: ${topicValidation.reasons.join('; ')}`;
      console.error(`❌ Topic rejected by validator: ${topicValidation.reasons.join('; ')}`);
      markTopicUsed(topic);
      return result;
    }
    if (topicValidation.status === 'ambiguous') {
      console.error(`⚠️  Topic is ambiguous (not in approved list): ${topicValidation.reasons.join('; ')}`);
    }
    
    console.error(`Generating: ${topic.title}`);
    const content = await generateContent(topic);
    
    const slug = slugify(topic.title);
    const postDate = topic.date;
    
    console.error(`Generating image for: ${topic.title}`);
    const imagePath = await generateImage(topic.title, slug);
    console.error(`✅ Image generated: ${imagePath}`);
    
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
      image: imagePath
    };
    
    const markdown = matter.stringify(content, frontmatter);
    const filename = `${postDate}-${slug}.md`;
    const filepath = path.join(DRAFTS_DIR, filename);
    fs.writeFileSync(filepath, markdown);
    
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
