#!/usr/bin/env node
/**
 * Topic Validation Script
 * Reads BLOG_TOPICS.md and validates proposed topics against:
 * 1. AVOID list (thematic overload categories)
 * 2. Approved topics list
 * 3. Existing published posts (slug/title similarity)
 *
 * Usage:
 *   node scripts/validate-topic.mjs "Proposed Topic Title"
 *   node scripts/validate-topic.mjs --check-category "keyword"
 *
 * Exit codes:
 *   0 = topic approved
 *   1 = topic rejected (in AVOID list or duplicate)
 *   2 = topic ambiguous (not in APPROVED list, manual review needed)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const TOPICS_FILE = path.join(ROOT, 'BLOG_TOPICS.md');

// ─── AVOID keywords: topics/categories that are overloaded ───
const AVOID_KEYWORDS = [
  // Agency vs Consultant (9 posts)
  'agency vs consultant', 'agency vs. consultant', 'marketing agency',
  'consultant vs agency', 'consultant vs. agency', 'hire agency',
  'fire agency', 'agency negotiation', 'agency contract',
  'agency accountability', 'agency problems', 'agency red flags',

  // SEO Best Practices (11 posts)
  'seo audit', 'seo best practices', 'local seo basics',
  'schema markup', 'seo vs ppc', 'seo vs. ppc',

  // Local Search & Geographic (14+ posts)
  'local search', 'local seo', 'google business profile',
  'local pack', 'county dominance', 'tampa marketing',
  'st petersburg marketing', 'clearwater marketing',
  'sarasota marketing', 'pinellas county', 'hillsborough county',
  'tampa bay marketing', 'florida law firm marketing',
  'multi-location',

  // Marketing Budget/ROI (8+ posts)
  'marketing budget', 'marketing roi', 'marketing spend',
  'marketing waste', 'marketing scorecard', 'marketing metrics',
  'marketing attribution', 'cost per lead',

  // Analytics/Tracking (8 posts)
  'ga4', 'google analytics', 'call tracking', 'crm integration',
  'referral tracking', 'lead quality vs volume',

  // Website & Design (9 posts)
  'website design', 'website homepage', 'website launch',
  'website compliance', 'website analytics', 'website losing',
  'website ownership', 'website seo and conversion',
  'wordpress migration', 'ditching wordpress',

  // Landing Pages (3 posts — sufficient)
  'landing page optimization', 'landing pages that convert',
  'landing pages fail',

  // Keyword Research (2 posts — sufficient)
  'keyword research', 'competitor keyword',

  // Lead Generation & Intake (6 posts)
  'intake process', 'intake speed', 'intake audit',
  'more leads wrong goal',

  // Content/Email/Video/Social (7 posts)
  'content marketing', 'content calendar', 'email marketing',
  'video marketing', 'social media marketing',
];

// ─── APPROVED categories (from BLOG_TOPICS.md "Approved New Topics") ───
const APPROVED_CATEGORIES = [
  'emerging ai search', 'ai overviews', 'perplexity', 'agent-based indexing',
  'regulatory changes', 'florida bar', 'ethics in digital marketing',
  'elder law', 'estate planning', 'employment law', 'dui defense',
  'client experience', 'client retention', 'onboarding', 'post-case communication',
  'client satisfaction', 'client lifetime value', 'upselling', 'cross-selling',
  'operational efficiency', 'staffing', 'workflow automation', 'billing integration',
  'competitive intelligence', 'win-loss analysis', 'market positioning',
  'firm growth stages', 'solo to', 'scaling', 'merger strategies',
  'solo practice', 'five attorneys', 'growing firm',
];

/**
 * Check if a topic matches any AVOID keywords
 */
function isInAvoidList(topic) {
  const topicLower = topic.toLowerCase();
  const matches = [];

  for (const keyword of AVOID_KEYWORDS) {
    if (topicLower.includes(keyword)) {
      matches.push(keyword);
    }
  }

  return { avoided: matches.length > 0, matches };
}

/**
 * Check if a topic falls within an APPROVED category
 */
function isInApprovedList(topic) {
  const topicLower = topic.toLowerCase();
  const matches = [];

  for (const keyword of APPROVED_CATEGORIES) {
    if (topicLower.includes(keyword)) {
      matches.push(keyword);
    }
  }

  return { approved: matches.length > 0, matches };
}

/**
 * Check for similar existing posts (>60% word overlap)
 */
function checkExistingPosts(topic) {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  const topicWords = new Set(
    topic.toLowerCase().split(/\W+/).filter(w => w.length > 3)
  );
  const similar = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const { data } = matter(content);
      const existingTitle = (data.title || '').toLowerCase();
      const existingWords = new Set(
        existingTitle.split(/\W+/).filter(w => w.length > 3)
      );

      if (topicWords.size > 0 && existingWords.size > 0) {
        const intersection = [...topicWords].filter(w => existingWords.has(w));
        const similarity = intersection.length / Math.max(topicWords.size, existingWords.size);

        if (similarity > 0.6) {
          similar.push({
            file,
            title: data.title,
            similarity: Math.round(similarity * 100),
            overlapping: intersection,
          });
        }
      }
    } catch (e) {
      // Skip file on error
    }
  }

  return similar.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Main validation function
 */
export function validateTopic(topic) {
  const result = {
    topic,
    status: 'unknown', // approved | rejected | ambiguous
    reasons: [],
    warnings: [],
  };

  // 1. Check AVOID list
  const avoidCheck = isInAvoidList(topic);
  if (avoidCheck.avoided) {
    result.status = 'rejected';
    result.reasons.push(
      `Topic matches AVOID keywords: ${avoidCheck.matches.join(', ')}`
    );
    return result;
  }

  // 2. Check for similar existing posts
  const similarPosts = checkExistingPosts(topic);
  if (similarPosts.length > 0) {
    const highSimilarity = similarPosts.filter(p => p.similarity >= 75);
    if (highSimilarity.length > 0) {
      result.status = 'rejected';
      result.reasons.push(
        `Too similar to existing posts: ${highSimilarity.map(p => `"${p.title}" (${p.similarity}%)`).join(', ')}`
      );
      return result;
    }
    // Moderate similarity = warning
    result.warnings.push(
      `Moderate similarity with: ${similarPosts.map(p => `"${p.title}" (${p.similarity}%)`).join(', ')}`
    );
  }

  // 3. Check APPROVED list
  const approvedCheck = isInApprovedList(topic);
  if (approvedCheck.approved) {
    result.status = 'approved';
    result.reasons.push(
      `Matches approved categories: ${approvedCheck.matches.join(', ')}`
    );
    return result;
  }

  // 4. Not in avoid, not in approved = ambiguous
  result.status = 'ambiguous';
  result.reasons.push(
    'Topic not found in APPROVED categories. Manual review recommended.'
  );
  return result;
}

// ─── CLI Entry Point ───
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const topic = process.argv.slice(2).join(' ');

  if (!topic) {
    console.error('Usage: node scripts/validate-topic.mjs "Proposed Topic Title"');
    process.exit(1);
  }

  const result = validateTopic(topic);

  console.log(JSON.stringify(result, null, 2));

  if (result.status === 'rejected') {
    console.error(`\n❌ REJECTED: ${result.reasons.join('; ')}`);
    process.exit(1);
  } else if (result.status === 'ambiguous') {
    console.error(`\n⚠️  AMBIGUOUS: ${result.reasons.join('; ')}`);
    if (result.warnings.length) {
      console.error(`   Warnings: ${result.warnings.join('; ')}`);
    }
    process.exit(2);
  } else {
    console.error(`\n✅ APPROVED: ${result.reasons.join('; ')}`);
    if (result.warnings.length) {
      console.error(`   Warnings: ${result.warnings.join('; ')}`);
    }
    process.exit(0);
  }
}
