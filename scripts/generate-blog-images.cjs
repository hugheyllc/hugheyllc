#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = 'process.env.OPENAI_API_KEY';
const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');
const IMAGE_DIR = path.join(process.cwd(), 'public/images/blog');

const STYLE = 'Very dark near-black background. Subtle warm gold accent lighting. Minimalist sophisticated law firm business context. No text, no words, no letters anywhere in the image. Dramatic professional editorial lighting. Widescreen 3:2 composition.';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-image-1',
      prompt: `${prompt}. ${STYLE}`,
      n: 1,
      size: '1536x1024'
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
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data[0] && json.data[0].b64_json) resolve(json.data[0].b64_json);
          else reject(new Error(JSON.stringify(json).substring(0, 200)));
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getSlugFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const slugMatch = content.match(/^slug:\s*"?([^"\n]+)"?/m);
  const titleMatch = content.match(/^title:\s*"?([^"\n]+)"?/m);
  const slug = slugMatch ? slugMatch[1].trim() : path.basename(filePath, '.md');
  const title = titleMatch ? titleMatch[1].trim().replace(/&amp;/g, '&').replace(/[""]/g, '"') : slug;
  return { slug, title };
}

function addImageToFrontmatter(filePath, imageRelPath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (/^image:/m.test(content)) return;
  content = content.replace(/^(draft:\s*\w+)$/m, `$1\nimage: "${imageRelPath}"`);
  fs.writeFileSync(filePath, content, 'utf8');
}

async function main() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} blog posts`);
  let generated = 0, skipped = 0, errors = 0;

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const { slug, title } = getSlugFromFile(filePath);
    const imageDest = path.join(IMAGE_DIR, `${slug}.png`);
    const imageRelPath = `/images/blog/${slug}.png`;

    if (fs.existsSync(imageDest)) {
      console.log(`  SKIP ${slug}`);
      skipped++; continue;
    }

    const prompt = `Abstract editorial image representing: ${title}. Law firm marketing, strategy, and business growth theme.`;

    try {
      process.stdout.write(`  GEN  ${slug} ... `);
      const b64 = await generateImage(prompt);
      fs.writeFileSync(imageDest, Buffer.from(b64, 'base64'));
      addImageToFrontmatter(filePath, imageRelPath);
      console.log('DONE');
      generated++;
      await sleep(6000); // gpt-image-1 allows ~10/min
    } catch(err) {
      console.log(`ERR: ${err.message}`);
      errors++;
      await sleep(3000);
    }
  }

  console.log(`\nDone. Generated: ${generated}, Skipped: ${skipped}, Errors: ${errors}`);
}

main();
