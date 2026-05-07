import { Resend } from 'resend';

const prerender = false;
async function GET({ request }) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${undefined                           }`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const resend = new Resend(undefined                              );
  try {
    const pagesToCheck = [
      { url: "https://hugheyllc.com/", name: "Homepage", type: "Organization" },
      { url: "https://hugheyllc.com/location", name: "Location", type: "LocalBusiness" },
      { url: "https://hugheyllc.com/about", name: "About", type: "Organization" },
      { url: "https://hugheyllc.com/services", name: "Services", type: "BreadcrumbList" }
    ];
    const schemaIssues = [];
    for (const page of pagesToCheck) {
      try {
        const response = await fetch(page.url);
        const html = await response.text();
        if (page.type === "Organization") {
          if (!html.includes('"@type":"Organization"') && !html.includes(`"@type":"${page.type}"`)) {
            schemaIssues.push({
              page: page.name,
              issue: `Missing ${page.type} schema markup`
            });
          }
        } else if (page.type === "LocalBusiness") {
          if (!html.includes('"@type":"LocalBusiness"')) {
            schemaIssues.push({
              page: page.name,
              issue: "Missing LocalBusiness schema markup"
            });
          }
        }
        if (page.type === "Organization") {
          const requiredProps = [
            '"name":"Hughey LLC"',
            '"url":"https://hugheyllc.com"',
            '"telephone"'
          ];
          const missingProps = requiredProps.filter((prop) => !html.includes(prop));
          if (missingProps.length > 0) {
            schemaIssues.push({
              page: page.name,
              issue: `Missing properties: ${missingProps.join(", ")}`
            });
          }
        }
      } catch (error) {
        schemaIssues.push({
          page: page.name,
          issue: `Failed to fetch page: ${error instanceof Error ? error.message : "Unknown error"}`
        });
      }
    }
    if (schemaIssues.length > 0) {
      const issuesList = schemaIssues.map((issue) => `<li><strong>${issue.page}</strong>: ${issue.issue}</li>`).join("");
      await resend.emails.send({
        from: "monitoring@hugheyllc.com",
        to: "joe@joehughey.com",
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
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        issuesFound: 0,
        message: "All schema.org markup is valid",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Schema validation error:", error);
    await resend.emails.send({
      from: "monitoring@hugheyllc.com",
      to: "joe@joehughey.com",
      subject: "❌ Schema Validation Check Failed",
      html: `
        <h2>Schema Validation Cron Job Error</h2>
        <p>The scheduled schema validation check encountered an error:</p>
        <pre>${error instanceof Error ? error.message : "Unknown error"}</pre>
        <p>Please investigate and rerun the check.</p>
      `
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: "Schema validation check failed",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
