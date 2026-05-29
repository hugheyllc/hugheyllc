// api/twitter-queue.js — Posts the next scheduled tweet from the queue
// Called by Vercel cron: morning (9am ET) and afternoon (2pm ET)

import tweets from '../twitter-content/queue.json' assert { type: 'json' };

export default async function handler(req, res) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Find next unposted tweet
  const next = tweets.find(t => !t.posted);
  if (!next) {
    return res.status(200).json({ message: 'Queue empty — refill needed' });
  }

  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: next.text }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twitter API error:', data);
      return res.status(response.status).json({ error: data });
    }

    // Note: We can't write back to the JSON file in a serverless env.
    // Queue management is done by Kenz manually rotating the file.
    console.log(`Posted tweet id=${data.data?.id}: ${next.text.slice(0, 60)}...`);
    return res.status(200).json({ success: true, tweet_id: data.data?.id, text: next.text });
  } catch (err) {
    console.error('Queue post failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
