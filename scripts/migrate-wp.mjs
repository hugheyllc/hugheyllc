import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const importFile = path.join(__dirname, 'import', 'export.xml');
const blogDir = path.join(__dirname, '..', 'src', 'content', 'blog');

// Ensure blog directory exists
if (!fs.existsSync(blogDir)) {
  fs.mkdirSync(blogDir, { recursive: true });
}

// Verify export file exists
if (!fs.existsSync(importFile)) {
  console.error(`❌ Error: WordPress export file not found at ${importFile}`);
  console.error('Please place your WordPress export.xml in scripts/import/');
  process.exit(1);
}

console.log('Starting WordPress to Astro migration...\n');

// Read and parse XML
const xmlData = fs.readFileSync(importFile, 'utf-8');
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

let rss;
try {
  const parsed = parser.parse(xmlData);
  rss = parsed.rss;
} catch (err) {
  console.error('❌ Error parsing XML:', err.message);
  process.exit(1);
}

const channel = rss?.channel;
if (!channel || !channel.item) {
  console.error('❌ Error: Invalid WordPress export format');
  process.exit(1);
}

// Ensure items is an array
const items = Array.isArray(channel.item) ? channel.item : [channel.item];

// Namespaces
const WP = 'wp';
const EXCERPT = 'excerpt';
const CONTENT = 'content';

let created = 0;
let skipped = 0;

// Helper: Strip HTML tags
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: Convert HTML to Markdown
function htmlToMarkdown(html) {
  if (!html) return '';

  let content = html;

  // Remove WordPress shortcodes
  content = content.replace(/\[caption[^\]]*\](.*?)\[\/caption\]/gs, '$1');
  content = content.replace(/\[gallery[^\]]*\]/g, '');
  content = content.replace(/\[\/?[a-z_]+[^\]]*\]/g, '');

  // Remove WordPress metadata
  content = content.replace(/<!--[\s\S]*?-->/g, '');

  // Convert block elements
  content = content.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
  content = content.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
  content = content.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');
  content = content.replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n');

  // Convert lists
  content = content.replace(/<ul[^>]*>/gi, '\n');
  content = content.replace(/<\/ul>/gi, '\n');
  content = content.replace(/<li[^>]*>(.*?)<\/li>/gi, '\n- $1');

  content = content.replace(/<ol[^>]*>/gi, '\n');
  content = content.replace(/<\/ol>/gi, '\n');
  content = content.replace(/<li[^>]*>(.*?)<\/li>/gi, '\n1. $1');

  // Convert inline elements
  content = content.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  content = content.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  content = content.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  content = content.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Remove remaining inline styles and attributes
  content = content.replace(/\s+style="[^"]*"/gi, '');
  content = content.replace(/\s+class="[^"]*"/gi, '');
  content = content.replace(/\s+[a-z]+=("[^"]*"|'[^']*')/gi, '');

  // Clean up whitespace
  content = content.replace(/\n\n+/g, '\n\n');
  content = content.replace(/^\s+|\s+$/g, '');

  return content;
}

// Helper: Get post status
function getPostStatus(item) {
  return item[`${WP}:status`] || item['wp:status'] || 'publish';
}

// Helper: Get post type
function getPostType(item) {
  return item[`${WP}:post_type`] || item['wp:post_type'] || 'post';
}

// Helper: Get post name (slug)
function getPostName(item) {
  return item[`${WP}:post_name`] || item['wp:post_name'] || '';
}

// Helper: Get post title
function getPostTitle(item) {
  return item.title || '';
}

// Helper: Get post content
function getPostContent(item) {
  return item[`${CONTENT}:encoded`] || item['content:encoded'] || '';
}

// Helper: Get post excerpt
function getPostExcerpt(item) {
  return item[`${EXCERPT}:encoded`] || item['excerpt:encoded'] || '';
}

// Helper: Get post date
function getPostDate(item) {
  return item.pubDate || '';
}

// Helper: Get post categories
function getPostCategories(item) {
  const categories = item.category;
  if (!categories) return [];
  const cats = Array.isArray(categories) ? categories : [categories];
  return cats
    .filter(cat => cat['@_nicename'] && cat['@_domain'] === 'post_tag')
    .map(cat => cat['@_nicename'])
    .filter(Boolean);
}

// Process each item
items.forEach((item, index) => {
  const status = getPostStatus(item);
  const postType = getPostType(item);
  const slug = getPostName(item);
  const title = getPostTitle(item);

  // Skip criteria
  if (status !== 'publish') {
    skipped++;
    console.log(`⊘ Skipped: ${slug || 'untitled'} (status: ${status})`);
    return;
  }

  if (postType === 'page') {
    skipped++;
    console.log(`⊘ Skipped: ${slug || 'untitled'} (type: page)`);
    return;
  }

  if (!slug) {
    skipped++;
    console.log(`⊘ Skipped: ${title || 'untitled'} (empty slug)`);
    return;
  }

  // Extract post data
  const rawExcerpt = getPostExcerpt(item);
  const excerptText = stripHtml(rawExcerpt) || stripHtml(getPostContent(item)).substring(0, 160);
  const excerpt = excerptText.substring(0, 160);

  const dateStr = getPostDate(item);
  const date = dateStr ? new Date(dateStr).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const contentRaw = getPostContent(item);
  const content = htmlToMarkdown(contentRaw);

  const categories = getPostCategories(item);
  const tagsArray = categories.length > 0 ? categories : [];

  // Build frontmatter
  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
slug: "${slug}"
date: ${date}
author: "Joe Hughey"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
tags: [${tagsArray.map(t => `"${t}"`).join(', ')}]
seo_title: "${title.replace(/"/g, '\\"')}"
seo_description: "${excerpt.replace(/"/g, '\\"')}"
draft: false
---`;

  // Write markdown file
  const filePath = path.join(blogDir, `${slug}.md`);
  const fullContent = `${frontmatter}\n\n${content}`;

  try {
    fs.writeFileSync(filePath, fullContent, 'utf-8');
    created++;
    console.log(`✓ Created: blog/${slug}.md`);
  } catch (err) {
    skipped++;
    console.error(`❌ Error writing ${slug}.md:`, err.message);
  }
});

console.log(`\n✨ Migration complete: ${created} posts created, ${skipped} skipped`);

if (created === 0) {
  console.log('\n⚠️  No posts were migrated. Check your WordPress export file.');
}
