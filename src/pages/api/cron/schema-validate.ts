import { Resend } from 'resend';

export const prerender = false;

export async function GET({ request }: { request: Request }) {
  // Verify this is actually a Vercel cron request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const resend = new Resend(import.meta.env.RESEND_API_KEY);

  try {
    // Validate schema.org markup on key pages
    const pagesToCheck = [
      { url: 'https://hugheyllc.com/', name: 'Homepage', type: 'Organization' },
      { url: 'https://hugheyllc.com/location', name: 'Location', type: 'LocalBusiness' },
      { url: 'https://hugheyllc.com/about', name: 'About', type: 'Organization' },
      { url: 'https://hugheyllc.com/services', name: 'Services', type: 'BreadcrumbList' }
    ];

    const schemaIssues: Array<{
      page: string;
      issue: string;
    }> = [];

    for (const page of pagesToCheck) {
      try {
        const response = await fetch(page.url);
        const html = await response.text();

        // Look for required schema.org markup
        if (page.type === 'Organization') {
          if (!html.includes('"@type":"Organization"') && !html.includes(`"@type":"${page.type}"`)) {
            schemaIssues.push({
              page: page.name,
              issue: `Missing ${page.type} schema markup`
            });
          }
        } else if (page.type === 'LocalBusiness') {
          if (!html.includes('"@type":"LocalBusiness"')) {
            schemaIssues.push({
              page: page.name,
              issue: 'Missing LocalBusiness schema markup'
            });
          }
        }

        // Check for required Organization properties
        if (page.type === 'Organization') {
          const requiredProps = [
            '"name":"Hughey LLC"',
            '"url":"https://hugheyllc.com"',
            '"telephone"'
          ];

          const missingProps = requiredProps.filter(prop => !html.includes(prop));
          if (missingProps.length > 0) {
            schemaIssues.push({
              page: page.name,
              issue: `Missing properties: ${missingProps.join(', ')}`
            });
          }
        }
      } catch (error) {
        schemaIssues.push({
          page: page.name,
          issue: `Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    // Send email alert if issues found
    if (schemaIssues.length > 0) {
      const issuesList = schemaIssues
        .map(issue => `<li><strong>${issue.page}</strong>: ${issue.issue}</li>`)
        .join('');

      await resend.emails.send({
        from: 'monitoring@hugheyllc.com',
        to: 'joe@joehughey.com',
        subject: `⚠️ Schema Validation Alert - ${schemaIssues.length} issues found`,
        html: `
          <h2>Schema.org Validation Issues Detected</h2>
          <p>The following pages have missing or incomplete schema.org markup:</p>
          <ul>
            ${issuesList}
          </ul>
          <p>Please review and fix these issues to maintain SEO performance.</p>
          <p><a href="https://schema.org/docs/schemas.html">Schema.org Documentation</a></p>
        `
      });

      return new Response(
        JSON.stringify({
          success: true,
          issuesFound: schemaIssues.length,
          issues: schemaIssues,
          emailSent: true,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        issuesFound: 0,
        message: 'All schema.org markup is valid',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Schema validation error:', error);

    // Send error notification
    await resend.emails.send({
      from: 'monitoring@hugheyllc.com',
      to: 'joe@joehughey.com',
      subject: '❌ Schema Validation Check Failed',
      html: `
        <h2>Schema Validation Cron Job Error</h2>
        <p>The scheduled schema validation check encountered an error:</p>
        <pre>${error instanceof Error ? error.message : 'Unknown error'}</pre>
        <p>Please investigate and rerun the check.</p>
      `
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Schema validation check failed',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
