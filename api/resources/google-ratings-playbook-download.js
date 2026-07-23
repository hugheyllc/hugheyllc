// Vercel Serverless Function — handles Google Ratings playbook downloads
import { Resend } from 'resend';

function playbookHtml() {
  return `
    <h3 style="color: #C8973A; font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Chapter 1: Why Google Ratings Matter</h3>
    <p>Visibility in local search, click-through rate lift, and the research proving one point on your rating moves the needle on calls and retained clients.</p>

    <h3 style="color: #C8973A; font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Chapter 2: The Three-Touch Review Request System</h3>
    <p><strong>Touch 1 (Email, 24–48h):</strong></p>
    <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 13px; overflow-x: auto;">Subject: Would you mind leaving a quick review?

Hi [Client Name],

We're glad we could help resolve [matter type]. If you've got a moment, we'd really appreciate a brief Google review of your experience with our firm.

It only takes a minute, and it helps other people in your situation find us.

[Your Firm Name]
Click here to leave a review: https://yourfirm.com/review

Thanks,
[Name/Title]</pre>

    <p><strong>Touch 2 (SMS, 7 days if no review):</strong></p>
    <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 13px; overflow-x: auto;">Hi [Client Name]—just following up. If you had a positive experience with [Your Firm], we'd love a Google review. Takes 1 minute: https://yourfirm.com/review</pre>

    <p><strong>Touch 3 (In-person):</strong> At final meeting: "If this process went well for you, would you mind leaving a Google review? Here's the link." Hand physical card.</p>

    <h3 style="color: #C8973A; font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Velocity Benchmarks</h3>
    <ul style="line-height: 1.8;">
      <li><strong>1–2 reviews/month:</strong> Rating declining relative to competitors</li>
      <li><strong>3–5 reviews/month:</strong> Maintaining position, signaling active business</li>
      <li><strong>6–8 reviews/month:</strong> Gaining ground; rating trends upward</li>
      <li><strong>10+ reviews/month:</strong> Aggressive growth</li>
    </ul>

    <h3 style="color: #C8973A; font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Chapter 3: The Four-Part Negative Review Response</h3>
    <p><strong>Part 1 (Acknowledgment):</strong> "We're sorry to hear you had a frustrating experience with our firm. We always want our clients to feel heard and respected."</p>

    <p><strong>Part 2 (Offer to Resolve):</strong> "We'd like to understand what went wrong and see if we can make it right. Please contact us directly at [phone] or [email] so we can discuss this privately."</p>

    <p><strong>Part 3 (Light Context, optional):</strong> "We do want to clarify that we reached out multiple times and attempted to discuss our strategy with you. We're happy to review our communication history directly."</p>

    <p><strong>Part 4 (Commitment):</strong> "We're committed to earning your trust. Please reach out."</p>

    <h3 style="color: #C8973A; font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Chapter 4: Which Disputes Actually Work</h3>
    <p><strong>Google removes reviews for:</strong></p>
    <ul style="line-height: 1.8;">
      <li>Conflict of interest (competitor leaving review)</li>
      <li>Off-topic content (unrelated to legal services)</li>
      <li>Spam (multiple similar reviews from same person)</li>
      <li>Hate speech or harassment (slurs or personal attacks on reviewer)</li>
      <li>Advertising (review that's actually an ad)</li>
      <li>Impersonation (fake review pretending to be real customer)</li>
    </ul>

    <p><strong>Google does NOT remove for:</strong></p>
    <ul style="line-height: 1.8;">
      <li>Factually incorrect reviews (even if completely false)</li>
      <li>Bad experiences (client had bad experience; that's allowed)</li>
      <li>Critical opinions (unfair criticism is usually protected)</li>
      <li>Emotional language ("worst lawyer ever" is inflammatory but not a violation)</li>
      <li>Low ratings without explanation (1-star with no text can't be flagged)</li>
    </ul>

    <h3 style="color: #C8973A; font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Chapter 5: Timeline from 3.5 to 4.2+ Stars</h3>
    <p><strong>Month 1–3 (Foundation):</strong> Implement request system, target 3–5 reviews/month, respond to all reviews within 24–48h. Rating stable (not yet improving).</p>
    <p><strong>Month 4–6 (Velocity):</strong> Expand to 6–8 reviews/month, add SMS as second touch, rating begins ticking upward (+0.1–0.2/month).</p>
    <p><strong>Month 7–12 (Momentum):</strong> Hold 6–8 reviews/month, dispute clear violations, rating climbs to 4.2–4.5+.</p>

    <h3 style="color: #C8973A; font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Chapter 6: Bar Compliance</h3>
    <p><strong>Allowed:</strong> Asking clients for reviews (soft ask with no incentive). Offering clients a tangible benefit (discount on future services, referral credit) to all clients regardless of review status.</p>
    <p><strong>Prohibited:</strong> Paying clients for reviews. Offering case discounts in exchange for reviews. Asking clients to leave reviews in exchange for free consultations.</p>
    <p><strong>Response Compliance:</strong> Keep responses brief. Avoid detailed discussion of case outcomes, specific legal strategies, comparative claims, or client names.</p>

    <h3 style="color: #C8973A; font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Chapter 7: Tracking and Reporting</h3>
    <p>Track: Review velocity per month, rating trend over time, click-through rate from reviews to your website. Share monthly with partner group.</p>

    <h3 style="color: #C8973A; font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Appendix A: Request Templates</h3>
    <p><strong>Email Template (Post-Close):</strong> See Chapter 2 above.</p>
    <p><strong>SMS Template:</strong> See Chapter 2 above.</p>
    <p><strong>Card to Hand at Meeting:</strong> "Have a moment? We'd love your Google review: yourfirm.com/review"</p>

    <h3 style="color: #C8973A; font-size: 16px; margin-top: 24px; margin-bottom: 12px;">Appendix B: Response Templates</h3>
    <p><strong>Positive Review Response:</strong> "Thank you so much for taking the time to leave this review. We're thrilled we could help. Feel free to reach out if you need anything else in the future."</p>
    <p><strong>Negative Review Response (4-part framework from Chapter 3):</strong> See Chapter 3 above.</p>
    <p><strong>Neutral Review Response:</strong> "Thanks for sharing your feedback. We'd love to understand what could have been better. Please reach out at [phone] or [email] so we can discuss this directly."</p>
  `;
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
      subject: 'Your Google Ratings Playbook — Hughey LLC',
      html: `
        <div style="font-family: Georgia, serif; max-width: 640px; color: #09131F;">
          <h2 style="color: #C8973A; margin-bottom: 4px;">Thanks, ${name}.</h2>
          <p style="font-size: 15px; line-height: 1.7; color: #444;">Here's the Improving Google Ratings playbook. Seven chapters, two appendices, and the complete system for building review velocity, responding to negative reviews without legal liability, and improving your rating from 3.5 to 4.2+ in 6–12 months.</p>
          <p style="font-size: 15px; line-height: 1.7; color: #444;">Use the templates, follow the timing, and run the system consistently. Most firms see meaningful improvement in the 4–6 month window.</p>
          <div style="margin: 24px 0; padding: 24px; background: #f9f6ef; border-left: 4px solid #C8973A;">
            ${playbookHtml()}
          </div>
          <p style="font-size: 15px; line-height: 1.7; color: #444;">Questions? Reply to this email or book a free strategy call to discuss your firm's rating and what's worth fixing first:</p>
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
      subject: `Playbook download: ${name} (${email})`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; color: #09131F;">
          <h2 style="border-bottom: 2px solid #C8973A; padding-bottom: 12px;">New Playbook Download</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 130px;">Name</td><td>${name}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Resource</td><td>Improving Google Ratings Playbook (7 chapters)</td></tr>
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
      body: JSON.stringify({ name, email, source: 'google-ratings-playbook' })
    }).catch(e => console.error('DB store failed:', e)) : Promise.resolve();

    const [userResult, joeResult] = await Promise.allSettled([userEmail, notifyJoe, addToAudience, storeLeadPromise]);

    if (userResult.status === 'rejected') {
      console.error('Failed to email user:', userResult.reason);
      return res.status(500).json({ success: false, error: 'Could not send the playbook. Please try again or email joe@joehughey.com.' });
    }

    if (joeResult.status === 'rejected') {
      console.error('Failed to notify Joe:', joeResult.reason);
    }

    return res.status(200).json({ success: true, message: 'Playbook sent. Check your inbox in the next minute or two.' });
  } catch (err) {
    console.error('Playbook download error:', err);
    return res.status(500).json({ success: false, error: 'An error occurred. Please try again or email joe@joehughey.com.' });
  }
}
