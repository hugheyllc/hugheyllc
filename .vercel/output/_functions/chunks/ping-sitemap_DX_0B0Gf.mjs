const prerender = false;
async function GET({ request }) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${undefined                           }`) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const sitemapUrl = "https://hugheyllc.com/sitemap-index.xml";
    await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
    await fetch(`http://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Sitemap pinged to search engines",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        sitemapUrl
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Sitemap ping error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to ping sitemap",
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
