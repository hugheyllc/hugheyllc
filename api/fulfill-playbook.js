// Vercel Serverless Function — fulfills "Always Found. Always Local." playbook
// after a successful Stripe Checkout session. Idempotent via session metadata.
import { Resend } from 'resend';

const PLAYBOOK_URL = 'https://hugheyllc.com/playbook/always-found-f3a9d2c1.html';
const SUPPORT_EMAIL = 'joe@hugheyllc.com';
const SUPABASE_URL = 'https://joyahdqniiqjmcmqjlue.supabase.co';

function buyerEmailHtml(firstName) {
  const greeting = firstName ? `Thanks, ${firstName}.` : 'Thanks for picking up the playbook.';
  return `
    <div style="font-family: Georgia, serif; max-width: 640px; color: #09131F;">
      <h2 style="color: #C8973A; margin-bottom: 4px;">${greeting}</h2>
      <p style="font-size: 15px; line-height: 1.7; color: #444;">Your copy of <strong>Always Found. Always Local. — The Law Firm Local SEO Playbook</strong> is below. One link, yours forever — bookmark it.</p>

      <div style="margin: 28px 0; padding: 28px; background: #f9f6ef; border-left: 4px solid #C8973A; text-align: center;">
        <p style="font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 14px;">Your Playbook</p>
        <p style="margin: 0 0 18px;"><a href="${PLAYBOOK_URL}" style="display: inline-block; background: #C8973A; color: #09131F; font-weight: 700; padding: 14px 28px; text-decoration: none; border-radius: 2px; letter-spacing: 0.04em;">Open the Playbook →</a></p>
        <p style="font-size: 13px; color: #666; margin: 0; word-break: break-all;"><a href="${PLAYBOOK_URL}" style="color: #666;">${PLAYBOOK_URL}</a></p>
      </div>

      <p style="font-size: 15px; line-height: 1.7; color: #444;"><strong>Want a local PDF?</strong> Open the link, then hit <strong>Ctrl + P</strong> (Cmd + P on Mac) and choose "Save as PDF". The page is print-formatted — it comes out clean.</p>

      <p style="font-size: 15px; line-height: 1.7; color: #444;">Work through Chapters 1–2 first. Chapter 2 is the single highest-leverage thing you will do in local SEO — get your Google Business Profile right before anything else.</p>

      <p style="font-size: 15px; line-height: 1.7; color: #444;">Run into something the playbook does not cover, or want a second set of eyes once you have built it out? Reply to this email — it comes straight to me.</p>

      <p style="font-size: 14px; line-height: 1.7; color: #666; margin-top: 32px;">— Joe Hughey<br/>Hughey LLC</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="font-size: 12px; color: #999;">Hughey LLC · 5412 Dover St NE, St. Petersburg, FL 33703 · <a href="https://hugheyllc.com" style="color: #999;">hugheyllc.com</a></p>
    </div>
  `;
}

function notifyJoeHtml(name, email, amountPaid, sessionId) {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; color: #09131F;">
      <h2 style="border-bottom: 2px solid #C8973A; padding-bottom: 12px;">Playbook Purchase</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; font-weight: bold; width: 130px;">Name</td><td>${name || '(not provided)'}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Resource</td><td>Always Found. Always Local. Playbook</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Amount</td><td>${amountPaid}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Session</td><td style="font-family: monospace; font-size: 12px;">${sessionId}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Submitted</td><td>${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST</td></tr>
      </table>
      <p style="margin-top: 24px; font-size: 13px; color: #888;">Reply to this email to follow up with ${name || email} directly.</p>
    </div>
  `;
}

async function stripeGet(path, secret) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  return { ok: res.ok, status: res.status, body: await res.json() };
}

async function stripePost(path, secret, params) {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => body.append(k, String(v)));
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  return { ok: res.ok, status: res.status, body: await res.json() };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionId = req.query?.session_id;
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return res.status(400).json({ error: 'Missing or invalid session_id.' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.error('STRIPE_SECRET_KEY not set');
    return res.status(500).json({ error: 'Server is not configured. Email ' + SUPPORT_EMAIL + '.' });
  }

  try {
    const sessionResp = await stripeGet(`checkout/sessions/${encodeURIComponent(sessionId)}`, stripeSecret);
    if (!sessionResp.ok) {
      if (sessionResp.status === 404) {
        return res.status(404).json({ error: 'We could not find that checkout session. Email ' + SUPPORT_EMAIL + ' with your receipt and we will sort it out.' });
      }
      console.error('Stripe session lookup failed:', sessionResp.status, sessionResp.body);
      return res.status(502).json({ error: 'Could not verify the purchase. Email ' + SUPPORT_EMAIL + '.' });
    }

    const session = sessionResp.body;

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment for this session has not completed yet. Refresh in a moment, or email ' + SUPPORT_EMAIL + ' if the issue persists.' });
    }

    const email = session.customer_details?.email || session.customer_email;
    const name = session.customer_details?.name || '';
    const amountPaid = typeof session.amount_total === 'number'
      ? `$${(session.amount_total / 100).toFixed(2)} ${String(session.currency || 'usd').toUpperCase()}`
      : 'unknown';

    if (!email) {
      console.error('No email on session', sessionId);
      return res.status(422).json({ error: 'No email was captured at checkout. Email ' + SUPPORT_EMAIL + ' with your receipt for delivery.' });
    }

    // Idempotency — has this session already been fulfilled?
    if (session.metadata?.fulfilled === '1') {
      return res.status(200).json({
        success: true,
        alreadyFulfilled: true,
        message: 'This purchase was already delivered. Check your inbox for the playbook link.',
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.RESEND_FROM || 'Hughey LLC <noreply@notifications.hugheyllc.com>';
    const firstName = (name || '').trim().split(/\s+/)[0] || '';

    const userEmailPromise = resend.emails.send({
      from: fromAddress,
      to: email,
      replyTo: SUPPORT_EMAIL,
      subject: 'Your Always Found Playbook — Download Inside',
      html: buyerEmailHtml(firstName),
    });

    const notifyJoePromise = resend.emails.send({
      from: fromAddress,
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: `Playbook purchase: ${name || email} (${amountPaid})`,
      html: notifyJoeHtml(name, email, amountPaid, sessionId),
    });

    // Store in Supabase
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const storeLeadPromise = supabaseKey
      ? fetch(`${SUPABASE_URL}/rest/v1/hugheyllc_leads`, {
          method: 'POST',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            name: name || email.split('@')[0],
            email,
            source: 'always-found-playbook',
          }),
        }).catch((e) => console.error('Supabase store failed:', e))
      : Promise.resolve();

    const [userEmailResult, notifyResult] = await Promise.allSettled([
      userEmailPromise,
      notifyJoePromise,
      storeLeadPromise,
    ]);

    if (userEmailResult.status === 'rejected') {
      console.error('Failed to email buyer:', userEmailResult.reason);
      return res.status(500).json({
        error: 'We took payment but could not send the email. Email ' + SUPPORT_EMAIL + ' and we will deliver it manually right away.',
      });
    }

    if (notifyResult.status === 'rejected') {
      console.error('Failed to notify Joe:', notifyResult.reason);
    }

    // Mark fulfilled on the session so refreshes do not resend.
    const markResp = await stripePost(
      `checkout/sessions/${encodeURIComponent(sessionId)}`,
      stripeSecret,
      { 'metadata[fulfilled]': '1', 'metadata[fulfilled_at]': new Date().toISOString() }
    );
    if (!markResp.ok) {
      console.warn('Could not mark session fulfilled:', markResp.status, markResp.body);
    }

    return res.status(200).json({
      success: true,
      email,
      message: 'Sent. Check your inbox in the next minute or two.',
    });
  } catch (err) {
    console.error('Playbook fulfillment error:', err);
    return res.status(500).json({ error: 'An error occurred. Email ' + SUPPORT_EMAIL + ' and we will sort it out.' });
  }
}
