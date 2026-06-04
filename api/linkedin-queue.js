// api/linkedin-queue.js — Posts the next scheduled LinkedIn share from the queue
// Called by Vercel cron: 10am ET daily
// Tracks posted count via Supabase social_posts so we don't repost the same item.

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const posts = require('../linkedin-content/queue.json');

async function countPosted(platform) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const url = `${SUPABASE_URL}/rest/v1/hugheyllc_social_posts?platform=eq.${platform}&select=id`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'count=exact',
      'Range-Unit': 'items',
      Range: '0-0',
    },
  });
  if (!res.ok) throw new Error(`Supabase count failed: ${res.status} ${await res.text()}`);
  const contentRange = res.headers.get('content-range') || '';
  const total = parseInt(contentRange.split('/')[1], 10);
  return Number.isFinite(total) ? total : 0;
}

async function recordPost(platform, content, externalId) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/hugheyllc_social_posts`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ platform, content, external_id: externalId, posted_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Supabase insert failed: ${res.status} ${await res.text()}`);
}

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { LINKEDIN_ACCESS_TOKEN, LINKEDIN_PERSON_URN } = process.env;
  if (!LINKEDIN_ACCESS_TOKEN || !LINKEDIN_PERSON_URN) {
    return res.status(500).json({ error: 'LinkedIn credentials not configured' });
  }

  let index;
  try {
    index = await countPosted('linkedin');
  } catch (err) {
    console.error('Supabase count failed:', err);
    return res.status(500).json({ error: 'Failed to read post count' });
  }

  if (index >= posts.length) {
    return res.status(200).json({ message: 'Queue empty' });
  }

  const next = posts[index];

  try {
    const url = 'https://api.linkedin.com/v2/ugcPosts';
    const body = {
      author: LINKEDIN_PERSON_URN,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: next.text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('LinkedIn API error:', data);
      return res.status(response.status).json({ error: data });
    }

    const postId = data.id || response.headers.get('x-restli-id');
    await recordPost('linkedin', next.text, postId);

    // Post comment with URL if comment_url is set
    if (next.comment_url && postId) {
      try {
        const commentUrl = 'https://api.linkedin.com/v2/socialActions/' + encodeURIComponent(postId) + '/comments';
        const commentBody = {
          actor: LINKEDIN_PERSON_URN,
          message: { text: 'https://' + next.comment_url.replace(/^https?:\/\//, '') },
        };
        await fetch(commentUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
          body: JSON.stringify(commentBody),
        });
        console.log('Posted first comment with link:', next.comment_url);
      } catch (commentErr) {
        console.error('Comment post failed (non-fatal):', commentErr);
      }
    }

    console.log(`Posted LinkedIn id=${postId} (index ${index}): ${next.text.slice(0, 60)}...`);
    return res.status(200).json({ success: true, post_id: postId, index, text: next.text });
  } catch (err) {
    console.error('LinkedIn queue post failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
