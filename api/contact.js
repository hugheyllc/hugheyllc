// Vercel Serverless Function — handles contact form submissions
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, firmName, email, phone, source, message, honeypot } = req.body;

    // Spam prevention
    if (honeypot) {
      return res.status(200).json({ success: true });
    }

    // Validate
    if (!name || !firmName || !email || !phone || !source || !message) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send notification to Joe
    const notifyJoe = resend.emails.send({
      from: 'Hughey LLC <no-reply@hugheyllc.com>',
      to: 'joe@joehughey.com',
      replyTo: email,
      subject: `New Inquiry: ${name} — ${firmName}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; color: #09131F;">
          <h2 style="border-bottom: 2px solid #C8973A; padding-bottom: 12px;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 130px;">Name</td><td>${name}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Firm</td><td>${firmName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Phone</td><td><a href="tel:${phone}">${phone}</a></td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Source</td><td>${source}</td></tr>
          </table>
          <div style="margin-top: 20px; background: #f9f6ef; border-left: 4px solid #C8973A; padding: 16px;">
            <strong>Message:</strong><br /><br />
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p style="margin-top: 24px; font-size: 12px; color: #888;">Reply to this email to respond directly to ${name}.</p>
        </div>
      `,
    });

    // Send confirmation to the user
    const confirmUser = resend.emails.send({
      from: 'Joe Hughey <no-reply@hugheyllc.com>',
      to: email,
      replyTo: 'joe@joehughey.com',
      subject: `Got your message — Hughey LLC`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; color: #09131F;">
          <h2 style="color: #C8973A;">Thanks, ${name}.</h2>
          <p style="font-size: 16px; line-height: 1.7;">I received your message about ${firmName} and will be in touch shortly.</p>
          <p style="font-size: 16px; line-height: 1.7;">If you need to reach me directly in the meantime:</p>
          <ul style="font-size: 15px; line-height: 1.8;">
            <li>Email: <a href="mailto:joe@joehughey.com">joe@joehughey.com</a></li>
            <li>Phone: <a href="tel:7274833222">727-483-3222</a></li>
          </ul>
          <p style="font-size: 16px; line-height: 1.7; margin-top: 24px;">— Joe</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="font-size: 12px; color: #999;">Hughey LLC · 5412 Dover St NE, St. Petersburg, FL 33703 · hugheyllc.com</p>
        </div>
      `,
    });

    const [joeResult, userResult] = await Promise.allSettled([notifyJoe, confirmUser]);

    if (joeResult.status === 'rejected') {
      console.error('Failed to notify Joe:', joeResult.reason);
      return res.status(500).json({ success: false, error: 'Failed to send message. Please call 727-483-3222.' });
    }

    if (userResult.status === 'rejected') {
      console.error('Failed to send user confirmation:', userResult.reason);
    }

    return res.status(200).json({ success: true, message: "Message sent. You'll hear from Joe soon." });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ success: false, error: 'An error occurred. Please call 727-483-3222.' });
  }
}
