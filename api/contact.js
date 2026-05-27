// Vercel Serverless Function — handles contact form submissions
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, firmName, phone, source, message, honeypot } = req.body;

    // Spam prevention
    if (honeypot) {
      return res.status(200).json({ success: true });
    }

    // Validate
    if (!name || !firmName || !phone || !source || !message) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: 'contact@hugheyllc.com',
      to: 'joe@joehughey.com',
      subject: `New Contact: ${name} from ${firmName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Firm:</strong> ${firmName}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Source:</strong> ${source}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      replyTo: phone,
    });

    if (result.error) {
      return res.status(500).json({ success: false, error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true, message: "Thank you! We'll respond within one business day." });
  } catch {
    return res.status(500).json({ success: false, error: 'An error occurred' });
  }
}
