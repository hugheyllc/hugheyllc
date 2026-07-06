#!/usr/bin/env node
/**
 * Generate blog post thumbnail images via OpenAI
 * Uses dall-e-3 for high quality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const IMAGES_DIR = path.join(ROOT, 'public/images/blog');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY not set');
  process.exit(1);
}

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

async function generateImage(title, slug) {
  const prompt = `Professional illustration for a law firm marketing blog post titled "${title}". 
A sophisticated law office setting showing digital marketing strategy, data analysis, or client relationship concepts.
Visual style: very dark near-black background, subtle warm gold accent lighting, minimalist professional aesthetic, no text or words, dramatic editorial lighting, 3:2 widescreen composition.`;

  console.error(`[Image] ${title}...`);

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
      const errorData = await response.json();
      console.error(`  Error: ${response.status}`, errorData);
      return null;
    }

    const data = await response.json();
    
    // Handle two response formats: URL or base64
    let imgBuffer;
    if (data.data[0].url) {
      // URL format
      const imageUrl = data.data[0].url;
      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) {
        console.error(`  Download failed: ${imgResp.status}`);
        return null;
      }
      imgBuffer = await imgResp.arrayBuffer();
    } else if (data.data[0].b64_json) {
      // Base64 format
      imgBuffer = Buffer.from(data.data[0].b64_json, 'base64');
    } else {
      console.error(`  Unexpected response format`);
      return null;
    }
    
    const imagePath = path.join(IMAGES_DIR, `${slug}.jpg`);
    fs.writeFileSync(imagePath, Buffer.from(imgBuffer));

    console.error(`  ✅ Saved: ${slug}.jpg`);
    return `/images/blog/${slug}.jpg`;
  } catch (e) {
    console.error(`  Error: ${e.message}`);
    return null;
  }
}

async function main() {
  const results = {
    timestamp: new Date().toISOString(),
    generated: [],
    failed: []
  };

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { data, content: body } = matter(content);

    const slug = path.basename(file, '.md');
    const imagePath = data.image;

    // Skip if image exists and is not a placeholder
    if (imagePath && !imagePath.includes('placeholder')) {
      const fullPath = path.join(ROOT, 'public', imagePath);
      if (fs.existsSync(fullPath)) {
        console.error(`[Skip] ${slug} - image exists`);
        continue;
      }
    }

    // Generate image
    const newImagePath = await generateImage(data.title, slug);
    if (!newImagePath) {
      results.failed.push({ slug, title: data.title });
      continue;
    }

    // Update frontmatter
    data.image = newImagePath;
    const updatedMarkdown = matter.stringify(body, data);
    fs.writeFileSync(filePath, updatedMarkdown);

    results.generated.push({ slug, title: data.title, image: newImagePath });
  }

  console.log(JSON.stringify(results, null, 2));
  return results;
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
