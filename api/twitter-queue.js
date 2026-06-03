// api/twitter-queue.js — Posts the next scheduled tweet from the queue
// Called by Vercel cron: 10am ET and 7pm ET
// Tracks posted count via Supabase social_posts so we don't repost the same tweet.
// Uses OAuth 1.0a (permanent — does not expire)

import tweets from '../twitter-content/queue.json' assert { type: 'json' };
import crypto from 'crypto';

function oauthHeader(method, url, consumerKey, consumerSecret, accessToken, accessTokenSecret) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: '1.0',
  };
  const baseStr = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&')),
  ].join('&');
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessTokenSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseStr).digest('base64');
  params.oauth_signature = signature;
  return 'OAuth ' + Object.keys(params).sort().map(k => `${encodeURIComponent(k)}="${encodeURIComponent(params[k])}"`).join(', ');
}

async function countPosted(platform) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const url = `${SUPABASE_URL}/rest/v1/social_posts?platform=eq.${platform}&select=id`;
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
  const res = await fetch(`${SUPABASE_URL}/rest/v1/social_posts`, {
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

  let index;
  try {
    index = await countPosted('twitter');
  } catch (err) {
    console.error('Supabase count failed:', err);
    return res.status(500).json({ error: 'Failed to read post count' });
  }

  if (index >= tweets.length) {
    return res.status(200).json({ message: 'Queue empty' });
  }

  const next = tweets[index];
  const { TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN_V1, TWITTER_ACCESS_TOKEN_SECRET } = process.env;

  try {
    const url = 'https://api.twitter.com/2/tweets';
    const auth = oauthHeader('POST', url, TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN_V1, TWITTER_ACCESS_TOKEN_SECRET);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: next.text }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Twitter API error:', data);
      return res.status(response.status).json({ error: data });
    }

    const tweetId = data.data?.id;
    await recordPost('twitter', next.text, tweetId);

    console.log(`Posted tweet id=${tweetId} (index ${index}): ${next.text.slice(0, 60)}...`);
    return res.status(200).json({ success: true, tweet_id: tweetId, index, text: next.text });
  } catch (err) {
    console.error('Queue post failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
