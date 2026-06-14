#!/usr/bin/env node
// Email nurture sequence for checklist leads.
// Runs daily via OpenClaw cron. Sends follow-up emails at day 3 and day 7.
// Tracks sent emails in hugheyllc_nurture_log to prevent duplicates.

import https from 'node:https';
import path from 'node:path';
import fs from 'node:fs';

// Load .env.local
const envPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://joyahdqniiqjmcmqjlue.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || 'Joe Hughey <no-reply@notifications.hugheyllc.com>';

if (!SUPABASE_KEY || !RESEND_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or RESEND_API_KEY');
  process.exit(1);
}

// ---------- HTTP helpers ----------

function fetchJSON(url, opts = {}) {
  return fetch(url, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  }).then(async (r) => {
    const text = await r.text();
    if (!r.ok) throw new Error(`${r.status}: ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : null;
  });
}

async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to,
      reply_to: 'joe@joehughey.com',
      subject,
      html,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Resend ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ---------- Email templates ----------

const emailStyle = `font-family: Georgia, serif; max-width: 640px; color: #09131F;`;
const goldColor = '#C8973A';
const signoff = `<p style="font-size: 14px; line-height: 1.7; color: #666; margin-top: 32px;">— Joe Hughey<br/>Hughey LLC</p>
<hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
<p style="font-size: 12px; color: #999;">Hughey LLC · 5412 Dover St NE, St. Petersburg, FL 33703 · <a href="https://hugheyllc.com" style="color: #999;">hugheyllc.com</a></p>`;

const emails = {
  day3: {
    subject: 'What law firms usually find in their marketing audit',
    html: (name) => `
<div style="${emailStyle}">
  <h2 style="color: ${goldColor}; margin-bottom: 4px;">The five gaps that keep showing up.</h2>
  <p style="font-size: 15px; line-height: 1.7; color: #444;">Hey ${name} — a few days ago you downloaded the 25-point marketing audit checklist. Most people skim it and mean to come back. In case that's you, here's what I see most often when I walk firms through this review:</p>

  <p style="font-size: 15px; line-height: 1.7; color: #444;"><strong>1. No one can name the cost per retained client by channel.</strong><br/>Firms track leads and calls. Almost no one tracks the cost of a signed retainer by source. That's the number that actually matters — and without it, you're guessing which channels deserve your budget.</p>

  <p style="font-size: 15px; line-height: 1.7; color: #444;"><strong>2. Google Ads "Presence or Interest" is turned on.</strong><br/>This is Google's default. It means your Tampa PI ads are showing to people in Ohio who Googled "Tampa personal injury lawyer" out of curiosity. Switching to "Presence" only can cut wasted spend by 15-30% overnight.</p>

  <p style="font-size: 15px; line-height: 1.7; color: #444;"><strong>3. Call tracking numbers aren't swapped by source.</strong><br/>One tracking number across all channels tells you calls came in. It doesn't tell you which channel produced them. That makes every ROI calculation a guess.</p>

  <p style="font-size: 15px; line-height: 1.7; color: #444;"><strong>4. Intake response time is assumed, not measured.</strong><br/>Most firms say "we respond fast." When they measure it, the average is 23 minutes. The firms that convert best respond in under 5. The gap between assumption and reality is where leads die.</p>

  <p style="font-size: 15px; line-height: 1.7; color: #444;"><strong>5. Agency reports are taken at face value.</strong><br/>If your agency sends a PDF full of impressions and clicks and you don't cross-check it against your own GA4 and CRM data — you don't know if the numbers are real. Not because they're lying, but because incentives are misaligned.</p>

  <p style="font-size: 15px; line-height: 1.7; color: #444;">If any of this sounds familiar, that's normal. These gaps exist at firms spending $10K/month and $100K/month alike. The difference is knowing where they are.</p>

  <p style="font-size: 15px; line-height: 1.7; color: #444;">Pull up the checklist and run through it with your intake coordinator or office manager. 30 minutes. You'll know exactly where the budget is leaking.</p>

  ${signoff}
</div>`,
  },

  day7: {
    subject: 'Fix it yourself for $97 — or keep paying your agency $5K/month',
    html: (name) => `
<div style="${emailStyle}">
  <h2 style="color: ${goldColor}; margin-bottom: 4px;">The audit found problems. Here's how to fix them.</h2>
  <p style="font-size: 15px; line-height: 1.7; color: #444;">Hey ${name} — last week you downloaded the marketing audit checklist. If you ran through it (or even skimmed it), you probably found gaps in your local SEO foundation or your review system. Those are the two areas where I see firms lose the most ground to competitors.</p>

  <p style="font-size: 15px; line-height: 1.7; color: #444;">I wrote two playbooks that fix exactly those problems:</p>

  <div style="margin: 24px 0; padding: 24px; background: #f9f6ef; border-left: 4px solid ${goldColor};">
    <p style="font-size: 16px; font-weight: bold; color: #09131F; margin: 0 0 8px;"><a href="https://hugheyllc.com/resources/always-found-playbook/" style="color: ${goldColor}; text-decoration: none;">Always Found. Always Local.</a> — $97</p>
    <p style="font-size: 14px; color: #444; margin: 0;">The complete local SEO system: GBP rebuild, 50+ citation sources, location page templates, schema markup, monthly maintenance. 136 pages, 8 chapters, 6 appendices.</p>
  </div>

  <div style="margin: 24px 0; padding: 24px; background: #f9f6ef; border-left: 4px solid ${goldColor};">
    <p style="font-size: 16px; font-weight: bold; color: #09131F; margin: 0 0 8px;"><a href="https://hugheyllc.com/resources/always-reviewed-playbook/" style="color: ${goldColor}; text-decoration: none;">Always Reviewed. Always Ranked.</a> — $97</p>
    <p style="font-size: 14px; color: #444; margin: 0;">The complete review system: 3-touch request sequences, 20 response templates, velocity tracking scorecard, platform priority matrix. 8 chapters, 7 appendices.</p>
  </div>

  <p style="font-size: 15px; line-height: 1.7; color: #444;">Both are built for firms with 5–30 attorneys who want to execute in-house. Same systems I've charged five figures to implement for consulting clients — written so your team can do it without outside help.</p>

  <p style="font-size: 15px; line-height: 1.7; color: #444;">No subscription. No upsell. One file, yours forever.</p>

  <p style="font-size: 15px; line-height: 1.7; color: #444;">If you'd rather have someone do the work for you instead, that's a fair choice — <a href="https://hugheyllc.com/contact/" style="color: ${goldColor};">let's talk</a>.</p>

  ${signoff}
</div>`,
  },
};

// ---------- Main ----------

async function main() {
  console.log('[nurture] Starting email nurture run');

  // Ensure nurture log table exists
  try {
    await fetchJSON(`${SUPABASE_URL}/rest/v1/hugheyllc_nurture_log?select=id&limit=1`);
  } catch (e) {
    if (e.message.includes('404') || e.message.includes('does not exist') || e.message.includes('42P01')) {
      console.log('[nurture] Creating hugheyllc_nurture_log table...');
      // Table doesn't exist — we'll need Joe to create it or use RPC
      console.error('[nurture] Table hugheyllc_nurture_log does not exist. Run this SQL in Supabase:\n' +
        'CREATE TABLE hugheyllc_nurture_log (\n' +
        '  id bigint generated always as identity primary key,\n' +
        '  email text not null,\n' +
        '  step text not null,\n' +
        '  sent_at timestamptz not null default now()\n' +
        ');\n' +
        'CREATE UNIQUE INDEX nurture_email_step ON hugheyllc_nurture_log (email, step);');
      process.exit(1);
    }
    throw e;
  }

  // Get checklist leads
  const leads = await fetchJSON(
    `${SUPABASE_URL}/rest/v1/hugheyllc_leads?source=eq.marketing-audit-checklist&select=name,email,created_at&order=created_at.asc`
  );
  console.log(`[nurture] Found ${leads.length} checklist leads`);

  // Get already-sent log
  const sent = await fetchJSON(
    `${SUPABASE_URL}/rest/v1/hugheyllc_nurture_log?select=email,step`
  );
  const sentSet = new Set(sent.map((s) => `${s.email}::${s.step}`));

  const now = Date.now();
  let sentCount = 0;

  for (const lead of leads) {
    const ageMs = now - new Date(lead.created_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const firstName = (lead.name || '').split(' ')[0] || 'there';

    for (const [step, minDays] of [['day3', 3], ['day7', 7]]) {
      if (ageDays < minDays) continue;
      if (sentSet.has(`${lead.email}::${step}`)) continue;

      const template = emails[step];
      try {
        console.log(`[nurture] Sending ${step} to ${lead.email}`);
        await sendEmail({
          to: lead.email,
          subject: template.subject,
          html: template.html(firstName),
        });

        // Log it
        await fetchJSON(`${SUPABASE_URL}/rest/v1/hugheyllc_nurture_log`, {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ email: lead.email, step }),
        });

        sentCount++;
        // Rate limit: 100ms between sends
        await new Promise((r) => setTimeout(r, 100));
      } catch (e) {
        console.error(`[nurture] Failed ${step} for ${lead.email}: ${e.message}`);
      }
    }
  }

  console.log(`[nurture] Done. Sent ${sentCount} emails.`);
}

main().catch((err) => {
  console.error(`[nurture] FATAL: ${err.stack || err.message}`);
  process.exit(1);
});
