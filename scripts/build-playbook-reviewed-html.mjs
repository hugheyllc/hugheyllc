// Build the self-contained HTML playbook from markdown.
// Reads /data/.openclaw/workspace/playbooks/always-reviewed-always-ranked-FULL.md
// Writes public/playbook/always-reviewed-a7f3e9b2.html

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const mdPath = '/data/.openclaw/workspace/playbooks/always-reviewed-always-ranked-FULL.md';
const outPath = resolve(repoRoot, 'public/playbook/always-reviewed-a7f3e9b2.html');

const md = readFileSync(mdPath, 'utf8');
const body = micromark(md, {
  extensions: [gfm()],
  htmlExtensions: [gfmHtml()],
  allowDangerousHtml: false,
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex, nofollow" />
<title>Always Reviewed. Always Ranked. — The Law Firm Review System Playbook | Hughey LLC</title>
<style>
  :root {
    --ink: #1a1a1a;
    --rule: #d8d2c4;
    --accent: #8a6a1f;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f7f4ed; color: var(--ink); }
  body {
    font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif;
    font-size: 18px;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #1a1a1a;
    color: #fff;
    padding: 12px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    letter-spacing: 0.04em;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }
  .toolbar-brand { font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .toolbar-brand span { color: #c8973a; }
  .toolbar-actions { display: flex; gap: 12px; }
  .toolbar button, .toolbar a {
    background: #c8973a;
    color: #1a1a1a;
    border: none;
    padding: 8px 18px;
    border-radius: 2px;
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    cursor: pointer;
    text-decoration: none;
    font-family: inherit;
  }
  .toolbar button:hover, .toolbar a:hover { background: #d9a94c; }
  main {
    max-width: 760px;
    margin: 0 auto;
    background: #fff;
    padding: 80px 72px 96px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  }
  main h1 {
    font-size: 36px;
    line-height: 1.15;
    margin: 0 0 8px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  main h1:first-child { font-size: 44px; text-align: center; margin-bottom: 0; }
  main h1:not(:first-child) {
    margin-top: 72px;
    padding-top: 32px;
    border-top: 3px double var(--rule);
  }
  main h2 {
    font-size: 26px;
    line-height: 1.25;
    margin: 48px 0 16px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  main h3 {
    font-size: 21px;
    line-height: 1.3;
    margin: 36px 0 12px;
    font-weight: 700;
    color: #2a2a2a;
  }
  main h4 {
    font-size: 17px;
    line-height: 1.35;
    margin: 28px 0 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--accent);
  }
  main p { margin: 0 0 18px; }
  main strong { color: #000; }
  main em { color: #2a2a2a; }
  main a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
  main a:hover { color: #6d521a; }
  main hr {
    border: none;
    border-top: 1px solid var(--rule);
    margin: 40px 0;
  }
  main ul, main ol { margin: 0 0 20px; padding-left: 28px; }
  main li { margin-bottom: 8px; }
  main blockquote {
    margin: 22px 0;
    padding: 4px 0 4px 22px;
    border-left: 3px solid var(--accent);
    color: #444;
    font-style: italic;
  }
  main code {
    font-family: "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    background: #f3efe5;
    border: 1px solid #e5dfcd;
    border-radius: 2px;
    padding: 1px 6px;
    font-size: 0.88em;
    color: #5a4515;
  }
  main pre {
    background: #fbf9f3;
    border: 1px solid #e5dfcd;
    border-left: 3px solid var(--accent);
    border-radius: 2px;
    padding: 16px 18px;
    margin: 20px 0;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.55;
  }
  main pre code {
    background: transparent;
    border: none;
    padding: 0;
    font-size: 13px;
    color: #2a2a2a;
  }
  main table {
    width: 100%;
    border-collapse: collapse;
    margin: 22px 0;
    font-size: 15px;
  }
  main th, main td {
    border: 1px solid var(--rule);
    padding: 9px 12px;
    text-align: left;
    vertical-align: top;
  }
  main th {
    background: #f3efe5;
    font-weight: 700;
  }
  /* Subtitle styling for the opening lines */
  main > p:nth-of-type(1) {
    text-align: center;
    font-size: 22px;
    color: #555;
    margin-top: 4px;
  }

  /* Print styles */
  @media print {
    body { background: #fff; font-size: 11.5pt; }
    .toolbar, .no-print { display: none !important; }
    main {
      max-width: 100%;
      padding: 0;
      margin: 0;
      box-shadow: none;
    }
    main h1 { page-break-before: always; }
    main h1:first-child { page-break-before: avoid; }
    main h2, main h3, main h4 { page-break-after: avoid; }
    main pre, main blockquote, main table { page-break-inside: avoid; }
    main a { color: #000; text-decoration: none; }
    main pre { background: #f9f9f9; border-color: #ccc; }
    @page {
      margin: 0.7in 0.8in;
    }
  }

  @media (max-width: 720px) {
    main { padding: 48px 28px 64px; }
    main h1:first-child { font-size: 32px; }
    main h1:not(:first-child) { font-size: 26px; }
    main h2 { font-size: 22px; }
    main h3 { font-size: 18px; }
    main { font-size: 17px; }
  }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <div class="toolbar-brand">Hughey <span>LLC</span></div>
    <div class="toolbar-actions">
      <button type="button" onclick="window.print()">Print / Save as PDF</button>
    </div>
  </div>
  <main>
${body}
  </main>
  <script>
    // Auto-link plain heading IDs so Table of Contents anchors work even if
    // the source markdown's anchor slugs differ from GitHub conventions.
    (function () {
      const hs = document.querySelectorAll('main h1, main h2, main h3, main h4');
      hs.forEach((h) => {
        if (h.id) return;
        const slug = h.textContent
          .toLowerCase()
          .replace(/[^a-z0-9\\s-]/g, '')
          .trim()
          .replace(/\\s+/g, '-');
        h.id = slug;
      });
    })();
  </script>
</body>
</html>
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html, 'utf8');
console.log(`Wrote ${outPath} (${html.length} bytes)`);
