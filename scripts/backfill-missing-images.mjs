#!/usr/bin/env node
/**
 * Backfill missing blog images
 * Uses same DALL-E 3 process as cron job
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const IMAGE_DIR = path.join(ROOT, 'public/images/blog');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY');
  process.exit(1);
}

if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
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
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1792x1024',
        quality: 'standard'
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`${response.status} - ${err.error?.message || JSON.stringify(err)}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;
    
    // Download image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imagePath = path.join(IMAGE_DIR, `${slug}.jpg`);
    fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
    
    console.log(`✅ ${slug}.jpg`);
    return true;
  } catch (e) {
    console.error(`❌ ${slug}: ${e.message}`);
    return false;
  }
}

async function backfill() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  const missing = [];
  
  // Find missing images
  for (const file of files) {
    try {
      const filePath = path.join(BLOG_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(content);
      
      const imagePath = data.image;
      if (!imagePath) continue;
      
      const filename = path.basename(imagePath);
      const fullPath = path.join(IMAGE_DIR, filename);
      
      if (!fs.existsSync(fullPath)) {
        missing.push({
          file,
          title: data.title || 'Untitled',
          imagePath,
          slug: filename.replace(/\.jpg$/, '')
        });
      }
    } catch (e) {
      console.error(`Error reading ${file}: ${e.message}`);
    }
  }
  
  if (missing.length === 0) {
    console.log('No missing images found.');
    return;
  }
  
  console.log(`\nFound ${missing.length} missing images. Generating...\n`);
  
  let success = 0;
  let failed = 0;
  
  // Generate images sequentially (rate limit friendly)
  for (const item of missing) {
    const result = await generateImage(item.title, item.slug);
    if (result) {
      success++;
    } else {
      failed++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Generated: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${missing.length}`);
}

(async () => {
  await backfill();
})();
