// api/twitter-post.js — Post a tweet on behalf of hugheyllc
// Called by Kenz (OpenClaw) to publish content to @HugheyLLC Twitter

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple shared secret to prevent unauthorized posts
  const authHeader = req.headers['x-api-key'];
  if (authHeader !== process.env.KENZ_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { text } = req.body;
  if (!text || text.length > 280) {
    return res.status(400).json({ error: 'Invalid tweet text (must be 1–280 chars)' });
  }

  try {
    // Use OAuth 2.0 Access Token (user context) to post
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twitter API error:', data);
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({ success: true, tweet_id: data.data?.id });
  } catch (err) {
    console.error('Tweet post failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
