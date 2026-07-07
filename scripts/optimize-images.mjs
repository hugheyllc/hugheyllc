#!/usr/bin/env node
/**
 * Optimize blog post images for web
 * Compress JPEG images to 60% quality for faster delivery
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public/images/blog');

const imagesToOptimize = [
  '7-law-firm-marketing-agency-problems-and-how-to-avoid-them.jpg',
  'google-business-profile-optimization-for-law-firms-beyond-th.jpg',
  'mobile-first-indexing-and-law-firm-websites-is-yours-actuall.jpg',
  'the-seo-graveyard-why-law-firm-websites-stop-ranking-and-how.jpg'
];

async function optimizeImage(filename) {
  const filepath = path.join(IMAGES_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`⏭️  ${filename} — not found`);
    return;
  }
  
  const stat = fs.statSync(filepath);
  const sizeBefore = stat.size / 1024;
  
  try {
    // Compress to 60% quality, max 1024x1024
    await sharp(filepath)
      .resize(1024, 1024, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 60, progressive: true })
      .toFile(filepath + '.tmp');
    
    // Replace original
    fs.renameSync(filepath + '.tmp', filepath);
    
    const statAfter = fs.statSync(filepath);
    const sizeAfter = statAfter.size / 1024;
    const reduction = ((1 - sizeAfter / sizeBefore) * 100).toFixed(0);
    
    console.log(`✅ ${filename}`);
    console.log(`   ${sizeBefore.toFixed(0)}KB → ${sizeAfter.toFixed(0)}KB (${reduction}% reduction)`);
  } catch (e) {
    console.log(`❌ ${filename} — ${e.message}`);
  }
}

async function main() {
  console.log('Optimizing blog post images...\n');
  
  for (const image of imagesToOptimize) {
    await optimizeImage(image);
  }
  
  console.log('\n✅ Done');
}

main();
