#!/usr/bin/env node
// Post the next tweet and LinkedIn post from the queues
// Usage: node scripts/post-from-queues.mjs [--twitter] [--linkedin] [--both]

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Load .env.hugheyllc (has all the credentials)
const envPath = path.resolve('/data/.openclaw/workspace/ops-director/.env.hugheyllc');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
}

// Check credentials
const required = ['TWITTER_CONSUMER_KEY', 'TWITTER_CONSUMER_SECRET', 'TWITTER_ACCESS_TOKEN_V1', 'TWITTER_ACCESS_TOKEN_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'LINKEDIN_ACCESS_TOKEN'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing env var: ${key}`);
    process.exit(1);
  }
}

// --- Twitter OAuth 1.0a Header ---
function oauthHeader(method, url) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = {
    oauth_consumer_key: process.env.TWITTER_CONSUMER_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: process.env.TWITTER_ACCESS_TOKEN_V1,
    oauth_version: '1.0',
  };
  const baseStr = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&')),
  ].join('&');
  const signingKey = `${encodeURIComponent(process.env.TWITTER_CONSUMER_SECRET)}&${encodeURIComponent(process.env.TWITTER_ACCESS_TOKEN_SECRET)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseStr).digest('base64');
  params.oauth_signature = signature;
  return 'OAuth ' + Object.keys(params).sort().map(k => `${encodeURIComponent(k)}="${encodeURIComponent(params[k])}"`).join(', ');
}

// --- Post to Twitter ---
async function postTweet(text) {
  const url = 'https://api.twitter.com/2/tweets';
  const auth = oauthHeader('POST', url);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twitter ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.data?.id;
}

// --- Count Posted ---
async function countPosted(platform) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/hugheyllc_social_posts?platform=eq.${platform}&select=id`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'count=exact',
      'Range-Unit': 'items',
      Range: '0-0',
    },
  });
  if (!res.ok) throw new Error(`Supabase count failed: ${res.status}`);
  const contentRange = res.headers.get('content-range') || '';
  const total = parseInt(contentRange.split('/')[1], 10);
  return Number.isFinite(total) ? total : 0;
}

// --- Record Post ---
async function recordPost(platform, content, externalId) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/hugheyllc_social_posts`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ platform, content, external_id: externalId, posted_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Supabase insert failed: ${res.status}`);
}

// --- Post to LinkedIn ---
async function postLinkedIn(text) {
  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: `urn:li:person:${process.env.LINKEDIN_PERSON_URN.split(':')[3]}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.id;
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const doTwitter = !args.length || args.includes('--twitter') || args.includes('--both');
  const doLinkedIn = !args.length || args.includes('--linkedin') || args.includes('--both');

  if (doTwitter) {
    try {
      console.log('[Twitter] Loading queue...');
      const tweets = JSON.parse(fs.readFileSync(path.join(ROOT, 'twitter-content/queue.json'), 'utf8'));
      const count = await countPosted('twitter');
      const tweet = tweets[count];
      if (!tweet) {
        console.log('  No more tweets in queue');
      } else {
        console.log(`  Posting tweet ${count + 1}/${tweets.length}`);
        const tweetId = await postTweet(tweet.text);
        await recordPost('twitter', tweet.text, tweetId);
        console.log(`  ✅ Posted tweet id=${tweetId}`);
      }
    } catch (e) {
      console.error(`  ❌ Twitter failed: ${e.message}`);
    }
  }

  if (doLinkedIn) {
    try {
      console.log('[LinkedIn] Loading queue...');
      const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'linkedin-content/queue.json'), 'utf8'));
      const count = await countPosted('linkedin');
      const post = posts[count];
      if (!post) {
        console.log('  No more posts in queue');
      } else {
        console.log(`  Posting post ${count + 1}/${posts.length}`);
        const postId = await postLinkedIn(post.text);
        await recordPost('linkedin', post.text, postId);
        console.log(`  ✅ Posted LinkedIn post id=${postId}`);
        // Post the blog URL as first comment
        try {
          const commentRes = await fetch(`https://api.linkedin.com/v2/socialActions/${postId}/comments`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
              'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify({
              object: postId,
              message: { text: `Full breakdown: ${post.comment_url}` },
            }),
          });
          if (commentRes.ok) {
            console.log(`     Posted first-comment URL`);
          }
        } catch (cErr) {
          console.log(`     (comment post failed: ${cErr.message})`);
        }
      }
    } catch (e) {
      console.error(`  ❌ LinkedIn failed: ${e.message}`);
    }
  }
}

main().catch(err => {
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
});
