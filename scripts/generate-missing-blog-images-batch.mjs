#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Get all blog posts and their image references
const blogDir = path.join(ROOT, 'src/content/blog');
const imageDir = path.join(ROOT, 'public/images/blog');
const posts = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));

const missing = [];

for (const post of posts) {
  const content = fs.readFileSync(path.join(blogDir, post), 'utf8');
  const match = content.match(/^image:\s*(.+)$/m);
  if (!match) {
    console.log(`⚠️  NO IMAGE REF: ${post}`);
    continue;
  }
  
  const imageRef = match[1].trim();
  const imagePath = path.join(imageDir, path.basename(imageRef));
  
  if (!fs.existsSync(imagePath)) {
    // Extract slug from filename
    const slug = post.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.md', '');
    const title = content.match(/^title:\s*['"](.+?)['"]/m)?.[1] || slug;
    
    missing.push({ slug, title, imagePath, imageName: path.basename(imageRef) });
  }
}

console.log(`\n📊 Missing Images Report:`);
console.log(`   Total missing: ${missing.length}`);
console.log(`   Sample batches to generate:\n`);

const batch1 = missing.slice(0, 10);
batch1.forEach(m => {
  console.log(`   - ${m.imageName}`);
  console.log(`     Title: ${m.title}`);
});

if (missing.length > 10) {
  console.log(`   ... and ${missing.length - 10} more`);
}

// Write missing list to file for batch processing
fs.writeFileSync(path.join(ROOT, 'MISSING_IMAGES.json'), JSON.stringify(missing, null, 2));
console.log(`\n✅ Missing images list saved to MISSING_IMAGES.json`);
console.log(`\nNext: Run generate-batch.mjs to create all missing images`);
