import { Resend } from 'resend';

export async function POST({ request }: { request: Request }) {
  const resend = new Resend(import.meta.env.RESEND_API_KEY);
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.json();
    const { name, firmName, phone, source, message, honeypot } = formData;
    
    // Spam prevention
    if (honeypot) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate
    if (!name || !firmName || !phone || !source || !message) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required fields' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send email
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
      replyTo: phone
    });

    if (result.error) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to send email' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Thank you! We\'ll respond within one business day.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: 'An error occurred' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
