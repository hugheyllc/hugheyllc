#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const blogDir = path.join(ROOT, 'src/content/blog');
const imageDir = path.join(ROOT, 'public/images/blog');
const posts = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));

const missing = [];

for (const post of posts) {
  const content = fs.readFileSync(path.join(blogDir, post), 'utf8');
  const match = content.match(/^image:\s*["']?(.+?)["']?\s*$/m);
  
  if (!match) {
    const slug = post.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.md', '');
    const title = content.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] || slug;
    missing.push({ slug, title, hasNoImage: true });
    continue;
  }
  
  let imageRef = match[1].trim().replace(/^["']|["']$/g, '');
  if (!imageRef || imageRef === 'null') {
    const slug = post.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.md', '');
    const title = content.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] || slug;
    missing.push({ slug, title, hasNoImage: true });
    continue;
  }
  
  const imagePath = path.join(imageDir, path.basename(imageRef));
  
  if (!fs.existsSync(imagePath)) {
    const slug = post.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.md', '');
    const title = content.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] || slug;
    missing.push({ slug, title, imageName: path.basename(imageRef) });
  }
}

console.log(`\n🔴 Missing Images: ${missing.length} posts`);
missing.slice(0, 15).forEach(m => {
  const reason = m.hasNoImage ? 'NO IMAGE FIELD' : `MISSING: ${m.imageName}`;
  console.log(`   ${m.slug}`);
  console.log(`   → ${m.title}`);
  console.log(`   → ${reason}\n`);
});

if (missing.length > 15) {
  console.log(`   ... and ${missing.length - 15} more\n`);
}

fs.writeFileSync(path.join(ROOT, 'MISSING_IMAGES.json'), JSON.stringify(missing, null, 2));
console.log(`✅ List saved to MISSING_IMAGES.json (${missing.length} items)`);
