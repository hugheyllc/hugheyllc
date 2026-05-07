export const prerender = false;

export async function GET({ request }: { request: Request }) {
  // Verify this is actually a Vercel cron request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Ping major search engines with sitemap
    const sitemapUrl = 'https://hugheyllc.com/sitemap-index.xml';

    // Google
    await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);

    // Bing
    await fetch(`http://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);

    // Also trigger a sitemap refresh in Search Console via API if you have setup
    // This is optional and requires additional setup

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sitemap pinged to search engines',
        timestamp: new Date().toISOString(),
        sitemapUrl
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Sitemap ping error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to ping sitemap',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
