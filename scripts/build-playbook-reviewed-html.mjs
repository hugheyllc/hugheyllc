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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Libre+Baskerville:ital@0;1&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #09131F;
    --navy: #0F2040;
    --mid: #1B3360;
    --gold: #C8973A;
    --glt: #DDA94E;
    --page: #FAFAF5;
    --warm: #F4EDE0;
    --text: #111827;
    --sub: #4A5568;
    --dim: #8896A5;
    --bdr: #E2D8C8;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--page); color: var(--text); }
  body {
    font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
    font-weight: 400;
  }
  .toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--ink);
    color: #fff;
    padding: 14px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: inherit;
    font-size: 13px;
    letter-spacing: 0.08em;
    box-shadow: 0 2px 12px rgba(0,0,0,0.12);
  }
  .toolbar-brand {
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 12px;
  }
  .toolbar-brand span { color: var(--gold); }
  .toolbar-actions { display: flex; gap: 14px; }
  .toolbar button, .toolbar a {
    background: var(--gold);
    color: var(--ink);
    border: none;
    padding: 10px 20px;
    border-radius: 2px;
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    cursor: pointer;
    text-decoration: none;
    font-family: inherit;
    transition: all 0.2s ease;
  }
  .toolbar button:hover, .toolbar a:hover { background: var(--glt); transform: translateY(-1px); }
  main {
    max-width: 800px;
    margin: 0 auto;
    background: #fff;
    padding: 64px 60px 80px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }
  main h1 {
    font-size: 38px;
    line-height: 1.15;
    margin: 0 0 6px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--navy);
  }
  main h1:first-child {
    font-size: 48px;
    text-align: center;
    margin-bottom: 12px;
    color: var(--navy);
  }
  main h1:first-child + p { text-align: center; font-size: 16px; color: var(--sub); margin-bottom: 28px; }
  main h1:not(:first-child) {
    margin-top: 56px;
    padding-top: 28px;
    border-top: 2px solid var(--bdr);
  }
  main h2 {
    font-size: 28px;
    line-height: 1.25;
    margin: 44px 0 14px;
    font-weight: 800;
    letter-spacing: -0.015em;
    color: var(--navy);
  }
  main h3 {
    font-size: 20px;
    line-height: 1.35;
    margin: 32px 0 10px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--text);
  }
  main h4 {
    font-size: 15px;
    line-height: 1.4;
    margin: 24px 0 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--gold);
  }
  main p { margin: 0 0 16px; color: var(--text); }
  main strong { color: var(--navy); font-weight: 700; }
  main em { font-family: 'Libre Baskerville', Georgia, serif; font-style: italic; color: var(--navy); }
  main a { color: var(--gold); text-decoration: none; border-bottom: 1px solid var(--gold); transition: color 0.2s; }
  main a:hover { color: var(--glt); border-color: var(--glt); }
  main hr {
    border: none;
    border-top: 1px solid var(--bdr);
    margin: 36px 0;
  }
  main ul, main ol { margin: 0 0 18px; padding-left: 24px; color: var(--text); }
  main li { margin-bottom: 7px; line-height: 1.7; }
  main blockquote {
    margin: 20px 0;
    padding: 0 0 0 20px;
    border-left: 3px solid var(--gold);
    color: var(--sub);
    font-style: italic;
    font-family: 'Libre Baskerville', Georgia, serif;
  }
  main code {
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
    background: var(--page);
    border: 1px solid var(--bdr);
    border-radius: 2px;
    padding: 2px 6px;
    font-size: 0.9em;
    color: var(--mid);
    font-weight: 500;
  }
  main pre {
    background: var(--warm);
    border: 1px solid var(--bdr);
    border-left: 3px solid var(--gold);
    border-radius: 2px;
    padding: 14px 16px;
    margin: 18px 0;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.6;
  }
  main pre code {
    background: transparent;
    border: none;
    padding: 0;
    font-size: 13px;
    color: var(--ink);
  }
  main table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 14px;
  }
  main th, main td {
    border: 1px solid var(--bdr);
    padding: 10px 12px;
    text-align: left;
    vertical-align: top;
  }
  main th {
    background: var(--page);
    font-weight: 700;
    color: var(--navy);
  }
  main td { color: var(--text); }

  /* Print styles */
  @media print {
    body { background: #fff; font-size: 12pt; }
    .toolbar, .no-print { display: none !important; }
    main {
      max-width: 100%;
      padding: 0.5in 0.75in;
      margin: 0;
      box-shadow: none;
    }
    main h1 { page-break-after: avoid; }
    main h1:first-child { page-break-after: avoid; }
    main h2, main h3, main h4 { page-break-after: avoid; }
    main pre, main blockquote, main table { page-break-inside: avoid; }
    main a { color: var(--navy); text-decoration: none; border: none; }
    main a::after { content: ' (' attr(href) ')'; font-size: 0.9em; color: var(--dim); }
    @page {
      margin: 0.75in;
      size: letter;
    }
  }

  @media (max-width: 768px) {
    main { padding: 40px 24px 56px; }
    main h1:first-child { font-size: 36px; }
    main h1 { font-size: 28px; }
    main h2 { font-size: 24px; }
    main h3 { font-size: 18px; }
    body { font-size: 15px; }
    main blockquote { padding-left: 16px; }
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
