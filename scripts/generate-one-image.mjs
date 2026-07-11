#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const IMAGES_DIR = path.join(ROOT, 'public/images/blog');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY not set');
  process.exit(1);
}

const slug = process.argv[2];
const title = process.argv[3];

if (!slug || !title) {
  console.error('Usage: generate-one-image.mjs <slug> <title>');
  process.exit(1);
}

const prompt = `Professional illustration for a law firm marketing blog post titled "${title}". A sophisticated law office setting showing digital marketing strategy. Visual style: very dark near-black background, subtle warm gold accent lighting, minimalist professional aesthetic, no text or words, dramatic editorial lighting, 3:2 widescreen composition.`;

(async () => {
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
      console.error('API error:', err);
      process.exit(1);
    }

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    let imgBuffer;
    if (data.data[0].url) {
      // URL format
      const imageUrl = data.data[0].url;
      const imgResp = await fetch(imageUrl);
      imgBuffer = await imgResp.arrayBuffer();
    } else if (data.data[0].b64_json) {
      // Base64 format
      imgBuffer = Buffer.from(data.data[0].b64_json, 'base64');
    } else {
      throw new Error('Unexpected response format: ' + JSON.stringify(data.data[0]));
    }
    
    const imagePath = path.join(IMAGES_DIR, `${slug}.jpg`);
    fs.writeFileSync(imagePath, Buffer.from(imgBuffer));
    
    console.log(`✅ Image saved: ${imagePath}`);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
