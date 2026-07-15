#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = '/data/Coding/hugheyllc-website';
const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const IMAGES_DIR = path.join(ROOT, 'public/images/blog');

// Load keys from gateway
function loadKeysFromGateway() {
  try {
    const config = JSON.parse(fs.readFileSync('/data/.openclaw/openclaw.json', 'utf8'));
    const providers = config?.models?.providers || {};
    return {
      anthropic: providers?.anthropic?.apiKey,
      openai: providers?.openai?.apiKey
    };
  } catch (e) {
    return { anthropic: null, openai: null };
  }
}

const keys = loadKeysFromGateway();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || keys.anthropic;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || keys.openai;

if (!ANTHROPIC_API_KEY || !OPENAI_API_KEY) {
  console.error('Missing API keys');
  process.exit(1);
}

// Parse queue
function getTopic() {
  const content = fs.readFileSync(path.join(ROOT, 'BLOG_TOPIC_QUEUE.md'), 'utf8');
  const lines = content.split('\n');
  
  let inQueue = false;
  for (const line of lines) {
    if (line.includes('## Queue')) inQueue = true;
    if (line.includes('## Completed')) break;
    
    // Match: "5. Topic Name" (no checkmark, no "Published")
    const match = line.match(/^(\d+)\.\s+([^✅].+?)(?:\s*\(Published|$)/);
    if (match && inQueue) {
      return match[2].trim();
    }
  }
  
  throw new Error('No unpublished topics');
}

// Create slug
function createSlug(topic) {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function main() {
  const topic = getTopic();
  console.log(`📝 Topic: ${topic}`);

  const slug = createSlug(topic);
  const date = new Date().toISOString().split('T')[0];
  const blogPath = path.join(BLOG_DIR, `${slug}.md`);
  const imagePath = path.join(IMAGES_DIR, `${slug}.jpg`);

  // Generate content with Claude Sonnet
  console.log('⏳ Generating content...');
  const contentResp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Write a comprehensive, SEO-optimized blog post for a law firm marketing consultancy.

Topic: "${topic}"

Requirements:
- Target: Law firm partners, managing directors, in-house counsel
- Tone: Professional, authoritative, practical
- Length: 2500-3500 words
- Structure: Intro, 4-6 H2 sections, conclusion with CTA
- Include: Statistics, actionable advice, case study references (generic examples)
- Markdown format, no frontmatter

Return ONLY the raw markdown body.`
      }]
    })
  });

  if (!contentResp.ok) throw new Error(`Claude error: ${contentResp.status}`);
  const contentData = await contentResp.json();
  const content = contentData.content[0].text;
  console.log(`✅ Content: ${content.length} chars`);

  // Generate image with DALL-E
  console.log('⏳ Generating image...');
  const imgResp = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `Professional illustration for legal marketing blog: "${topic}". Style: Clean, minimalist, corporate. Colors: Blues, grays. No text/people/faces. 1200x630px.`,
      n: 1,
      size: '1200x630'
    })
  });

  if (!imgResp.ok) throw new Error(`OpenAI error: ${imgResp.status}`);
  const imgData = await imgResp.json();
  const imageUrl = imgData.data[0].url;

  // Fetch and optimize image
  console.log('⏳ Optimizing image...');
  const fetchResp = await fetch(imageUrl);
  const imageBuffer = await fetchResp.arrayBuffer();
  
  // Use sharp inline
  const sharp = (await import('sharp')).default;
  const optimized = await sharp(Buffer.from(imageBuffer))
    .resize(1200, 630, { fit: 'cover' })
    .jpeg({ quality: 70, progressive: true })
    .toBuffer();

  console.log(`✅ Image: ${(optimized.length / 1024).toFixed(1)}KB`);

  // Write files
  const frontmatter = `---
title: ${topic}
slug: ${slug}
date: '${date}'
author: Joe Hughey
excerpt: ${topic}
tags:
  - law firm marketing
seo_title: ${topic}
seo_description: ${topic}
draft: false
image: /images/blog/${slug}.jpg
---

`;

  fs.writeFileSync(blogPath, frontmatter + content);
  fs.writeFileSync(imagePath, optimized);
  console.log(`✅ Files written`);

  // Git commit & push
  process.chdir(ROOT);
  execSync('git add -A', { stdio: 'pipe' });
  execSync(`git commit -m "Blog: ${topic} (${date})"`, { stdio: 'pipe' });
  execSync('git push origin main', { stdio: 'pipe' });
  console.log(`✅ Committed & pushed`);

  console.log(JSON.stringify({
    status: 'success',
    topic,
    slug,
    date,
    imageSize: `${(optimized.length / 1024).toFixed(1)}KB`
  }));
}

main().catch(e => {
  console.error(`ERROR: ${e.message}`);
  process.exit(1);
});
