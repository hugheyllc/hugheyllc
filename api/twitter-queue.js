// api/twitter-queue.js — Posts the next scheduled tweet from the queue
// Called by Vercel cron: morning (9am ET) and afternoon (2pm ET)
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

export default async function handler(req, res) {
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const next = tweets.find(t => !t.posted);
  if (!next) {
    return res.status(200).json({ message: 'Queue empty — refill needed' });
  }

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

    console.log(`Posted tweet id=${data.data?.id}: ${next.text.slice(0, 60)}...`);
    return res.status(200).json({ success: true, tweet_id: data.data?.id, text: next.text });
  } catch (err) {
    console.error('Queue post failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
