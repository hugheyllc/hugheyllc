#!/usr/bin/env node
/**
 * Generate missing blog post images using OpenAI gpt-image-1
 * 
 * RULES (non-negotiable):
 * 1. Model: gpt-image-1 ONLY
 * 2. Size: 1536x1024 only (no other sizes)
 * 3. No response_format parameter (gpt-image-1 returns b64_json by default)
 * 4. STYLE constant is mandatory
 * 5. Sleep 6000ms between requests (rate limit: ~10/min)
 * 6. Output format: JPG to /public/images/blog/[slug].jpg
 * 7. Update frontmatter: add image: "/images/blog/[slug].jpg" if missing
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, '../src/content/blog');
const IMAGE_DIR = path.join(__dirname, '../public/images/blog');

// NON-NEGOTIABLE STYLE
const STYLE = 'Very dark near-black background. Subtle warm gold accent lighting. Minimalist sophisticated law firm business context. No text, no words, no letters anywhere in the image. Dramatic professional editorial lighting. Widescreen composition.';

// API KEY from environment
const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('FATAL: OPENAI_API_KEY not set');
  process.exit(1);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-image-1',
      prompt: `${prompt}. ${STYLE}`,
      n: 1,
      size: '1536x1024'
      // NOTE: NO response_format parameter. gpt-image-1 returns b64_json by default.
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`OpenAI Error: ${json.error.message}`));
          } else if (json.data && json.data[0] && json.data[0].b64_json) {
            resolve(json.data[0].b64_json);
          } else {
            reject(new Error(`No b64_json in response: ${JSON.stringify(json).substring(0, 200)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getSlugAndTitle(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const slugMatch = content.match(/^slug:\s*"?([^"\n]+)"?/m);
  const titleMatch = content.match(/^title:\s*"?([^"\n]+)"?/m);
  
  const slug = slugMatch ? slugMatch[1].trim() : path.basename(filePath, '.md');
  const title = titleMatch ? titleMatch[1].trim().replace(/[""]/g, '"') : slug;
  
  return { slug, title };
}

function updateFrontmatterWithImage(filePath, imageRelPath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Only add if not already present
  if (/^image:/m.test(content)) {
    return false; // Already has image
  }
  
  // Add after draft line
  content = content.replace(/^(draft:\s*\w+)$/m, `$1\nimage: "${imageRelPath}"`);
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

async function main() {
  console.log('🔄 Generating missing blog images...\n');
  
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} blog posts\n`);
  
  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const { slug, title } = getSlugAndTitle(filePath);
    const imageDest = path.join(IMAGE_DIR, `${slug}.jpg`);
    const imageRelPath = `/images/blog/${slug}.jpg`;

    // Skip if image already exists
    if (fs.existsSync(imageDest)) {
      console.log(`  ⏭️  SKIP ${slug}`);
      skipped++;
      continue;
    }

    const prompt = `Abstract editorial image representing: ${title}. Law firm marketing, business strategy, and professional growth context.`;

    try {
      process.stdout.write(`  🎨 GEN  ${slug} ... `);
      const b64 = await generateImage(prompt);
      
      // Ensure directory exists
      fs.mkdirSync(IMAGE_DIR, { recursive: true });
      
      // Write JPG (not PNG)
      fs.writeFileSync(imageDest, Buffer.from(b64, 'base64'));
      
      // Update frontmatter
      updateFrontmatterWithImage(filePath, imageRelPath);
      
      console.log('✅ DONE');
      generated++;
      
      // MANDATORY: Rate limiting for gpt-image-1 (~10 per minute = 6s between requests)
      await sleep(6000);
    } catch (err) {
      console.log(`❌ ERR: ${err.message}`);
      errors++;
      await sleep(3000);
    }
  }

  console.log(`\n📊 Summary: Generated=${generated}, Skipped=${skipped}, Errors=${errors}`);
  
  if (errors > 0) {
    process.exit(1); // Fail if any errors
  }
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
