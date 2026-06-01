// Vercel Serverless Function — handles marketing audit checklist downloads
import { Resend } from 'resend';

const checklistSections = [
  {
    title: 'Ad Attribution & Tracking',
    items: [
      'Google Ads conversion tracking installed and firing on retained-client events (not just form submissions)',
      'UTM parameters on every paid traffic source (Google, Meta, LSAs, directories, email)',
      'Phone calls attributed to traffic source via dynamic call tracking (CallRail, WhatConverts, or equivalent)',
      'Call tracking numbers swapped per source — not one number across all channels',
      'GA4 configured with conversion events tied to qualified intake (not page views)',
    ],
  },
  {
    title: 'Intake & Lead Capture',
    items: [
      'Intake response time under 5 minutes during business hours (documented, not assumed)',
      'After-hours coverage: live answering service or AI receptionist with handoff to intake the next morning',
      'Intake script captures source ("How did you hear about us?") on every call',
      'Web forms tied directly to your CRM — no manual data entry between systems',
      'Drop-off rate measured at every stage: form → qualified call → consult booked → retained',
    ],
  },
  {
    title: 'Google Ads Setup',
    items: [
      'Search campaigns separated from Display and Performance Max (PMax is hiding spend if mixed)',
      'Negative keyword list reviewed monthly — at minimum filtering free legal advice, jobs, salary, and competitor names',
      'Conversion value column shows revenue, not lead count (so Smart Bidding optimizes toward retained cases)',
      'Local Services Ads (LSAs) running in parallel and tracked separately from standard Search',
      'Geo-targeting set to "Presence" only — not "Presence or Interest" (which leaks budget nationally)',
    ],
  },
  {
    title: 'SEO & Google Business Profile',
    items: [
      'Practice-area landing pages exist for every service you want to rank for (not all on one services page)',
      'City + practice-area pages built for each market you actually serve (not just your home city)',
      'Google Business Profile fully optimized: services, hours, photos, weekly posts, Q&A populated',
      'Review velocity: at least 3-5 new Google reviews per month, with owner responses on every one',
      'Schema markup deployed: LegalService, Attorney, FAQPage, and BreadcrumbList at minimum',
    ],
  },
  {
    title: 'Reporting & CRM Operations',
    items: [
      'Cost per retained client calculated monthly by channel (not cost per lead)',
      'CRM (Lawmatics, Clio Grow, or equivalent) captures source, stage, disposition, and signed-fee value for every matter',
      'Pipeline report shared monthly with the partner group — not just the marketing team',
      'Agency reports cross-checked against your own GA4 and CRM data quarterly (not taken at face value)',
      'A single dashboard combining ad spend, intake volume, signed cases, and revenue — refreshed at least weekly',
    ],
  },
];

function checklistHtml() {
  return checklistSections.map(section => `
    <h3 style="color: #C8973A; font-size: 18px; margin-top: 28px; margin-bottom: 14px; border-bottom: 1px solid #eee; padding-bottom: 8px;">${section.title}</h3>
    <ol style="padding-left: 22px; line-height: 1.7; color: #2a2a2a;">
      ${section.items.map(item => `<li style="margin-bottom: 10px;">${item}</li>`).join('')}
    </ol>
  `).join('');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, honeypot } = req.body || {};

    if (honeypot) {
      return res.status(200).json({ success: true });
    }

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.RESEND_FROM || 'Hughey LLC <no-reply@notifications.hugheyllc.com>';

    const userEmail = resend.emails.send({
      from: fromAddress,
      to: email,
      replyTo: 'joe@joehughey.com',
      subject: 'Your Law Firm Marketing Audit Checklist — Hughey LLC',
      html: `
        <div style="font-family: Georgia, serif; max-width: 640px; color: #09131F;">
          <h2 style="color: #C8973A; margin-bottom: 4px;">Thanks, ${name}.</h2>
          <p style="font-size: 15px; line-height: 1.7; color: #444;">Here's the 25-point Law Firm Marketing Audit Checklist. Use it to evaluate your current marketing operation — channel by channel, system by system.</p>
          <p style="font-size: 15px; line-height: 1.7; color: #444;">If any of these gaps look familiar at your firm, that's usually where the budget is leaking.</p>
          <div style="margin: 24px 0; padding: 24px; background: #f9f6ef; border-left: 4px solid #C8973A;">
            ${checklistHtml()}
          </div>
          <p style="font-size: 15px; line-height: 1.7; color: #444;">When you're ready to dig into your numbers, reply to this email or book a free strategy call:</p>
          <p style="margin: 18px 0;"><a href="https://hugheyllc.com/contact/" style="display: inline-block; background: #C8973A; color: #09131F; font-weight: 700; padding: 12px 24px; text-decoration: none; border-radius: 2px;">Schedule a Free Call →</a></p>
          <p style="font-size: 14px; line-height: 1.7; color: #666; margin-top: 32px;">— Joe Hughey<br/>Hughey LLC</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="font-size: 12px; color: #999;">Hughey LLC · 5412 Dover St NE, St. Petersburg, FL 33703 · <a href="https://hugheyllc.com" style="color: #999;">hugheyllc.com</a></p>
        </div>
      `,
    });

    const notifyJoe = resend.emails.send({
      from: fromAddress,
      to: 'joe@joehughey.com',
      replyTo: email,
      subject: `Checklist download: ${name} (${email})`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; color: #09131F;">
          <h2 style="border-bottom: 2px solid #C8973A; padding-bottom: 12px;">New Checklist Download</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 130px;">Name</td><td>${name}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Resource</td><td>Marketing Audit Checklist (25 points)</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Submitted</td><td>${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST</td></tr>
          </table>
          <p style="margin-top: 24px; font-size: 13px; color: #888;">Reply to this email to follow up with ${name} directly.</p>
        </div>
      `,
    });

    // Add to Resend audience + store in DB
    const audienceId = '5b25f3ea-314c-4fcb-9a5b-fc38f5c4061f';
    const addToAudience = fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, first_name: name.split(' ')[0], last_name: name.split(' ').slice(1).join(' ') || '', unsubscribed: false })
    }).catch(e => console.error('Audience add failed:', e));

    // Store in Supabase
    const SUPABASE_URL = 'https://joyahdqniiqjmcmqjlue.supabase.co';
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const storeLeadPromise = SUPABASE_KEY ? fetch(`${SUPABASE_URL}/rest/v1/hugheyllc_leads`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name, email, source: 'marketing-audit-checklist' })
    }).catch(e => console.error('DB store failed:', e)) : Promise.resolve();

    const [userResult, joeResult] = await Promise.allSettled([userEmail, notifyJoe, addToAudience, storeLeadPromise]);

    if (userResult.status === 'rejected') {
      console.error('Failed to email user:', userResult.reason);
      return res.status(500).json({ success: false, error: 'Could not send the checklist. Please try again or email joe@joehughey.com.' });
    }

    if (joeResult.status === 'rejected') {
      console.error('Failed to notify Joe:', joeResult.reason);
    }

    return res.status(200).json({ success: true, message: 'Checklist sent. Check your inbox in the next minute or two.' });
  } catch (err) {
    console.error('Checklist download error:', err);
    return res.status(500).json({ success: false, error: 'An error occurred. Please try again or email joe@joehughey.com.' });
  }
}
