import { Resend } from 'resend';

const VALID_PASSWORD = process.env.CLIENT_PORTAL_PASSWORD || 'hughey2025';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://joyahdqniiqjmcmqjlue.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function checkAuth(password) {
  return password === VALID_PASSWORD;
}

async function supabaseFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Portal-Password');
  res.setHeader('Content-Type', 'application/json');
  


  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Auth check
  const password = req.headers['x-portal-password'] || '';
  if (!checkAuth(password)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Validate Supabase config
  if (!SUPABASE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // ── POST: Create new ticket ──
    if (req.method === 'POST') {
      const { client_name, email, phone, request_type, description, priority, due_date } = req.body;

      if (!client_name || !email || !request_type || !description) {
        return res.status(400).json({
          error: 'Missing required fields: client_name, email, request_type, description',
        });
      }

      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      const finalPriority = validPriorities.includes(priority) ? priority : 'normal';

      const payload = {
        client_name,
        email,
        phone: phone || null,
        request_type,
        description,
        priority: finalPriority,
        due_date: due_date || null,
        status: 'open',
        notes: '',
      };

      const response = await supabaseFetch('client_requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase POST error:', response.status, errorText);
        return res.status(500).json({ error: 'Failed to create request', details: errorText });
      }

      const data = await response.json();
      const ticket = Array.isArray(data) ? data[0] : data;

      // Queue emails asynchronously without blocking response
      try {
        // Don't await - fire and forget
        setImmediate(async () => {
          console.log(`[QUEUE] Email tasks started for ${ticket.ticket_id}`);
          try {
            await sendAdminNotificationEmail(ticket);
          } catch (err) {
            console.error(`[EMAIL-ERROR] Admin failed for ${ticket.ticket_id}:`, err.message);
          }
          try {
            await sendClientConfirmationEmail(ticket);
          } catch (err) {
            console.error(`[EMAIL-ERROR] Client failed for ${ticket.ticket_id}:`, err.message);
          }
        });
      } catch (err) {
        console.error(`[QUEUE-ERROR] Failed to queue emails:`, err.message);
      }

      // Send response immediately - emails will process in background
      return res.status(201).json({
        success: true,
        ticket_id: ticket.ticket_id,
        message: `Request created successfully. Your ticket ID is ${ticket.ticket_id}.`,
      });
    }

    // ── GET: List tickets with filters ──
    if (req.method === 'GET') {
      const { status, priority, search, id } = req.query;

      let query = 'select=*&order=created_at.desc';

      if (id) {
        query = `select=*&id=eq.${id}`;
      } else {
        if (status && status !== 'all') {
          query += `&status=eq.${status}`;
        }
        if (priority && priority !== 'all') {
          query += `&priority=eq.${priority}`;
        }
        if (search) {
          const s = encodeURIComponent(search);
          query += `&or=(client_name.ilike.*${s}*,email.ilike.*${s}*,ticket_id.ilike.*${s}*,description.ilike.*${s}*)`;
        }
      }

      const response = await supabaseFetch(`client_requests?${query}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase GET error:', response.status, errorText);
        return res.status(500).json({ error: 'Failed to fetch requests' });
      }

      const data = await response.json();
      return res.status(200).json(Array.isArray(data) ? data : [data]);
    }

    // ── PATCH: Update ticket status/notes ──
    if (req.method === 'PATCH') {
      const { id, status, notes } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Missing request id' });
      }

      const updates = {};
      if (status) {
        const validStatuses = ['open', 'in-progress', 'completed'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: 'Invalid status. Must be: open, in-progress, or completed' });
        }
        updates.status = status;
      }

      if (notes !== undefined) {
        updates.notes = notes;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      // Fetch the current ticket BEFORE updating so we can detect status changes
      let currentTicket = null;
      if (status) {
        const fetchRes = await supabaseFetch(`client_requests?id=eq.${id}&select=*`, {
          method: 'GET',
        });
        if (fetchRes.ok) {
          const fetchData = await fetchRes.json();
          currentTicket = Array.isArray(fetchData) ? fetchData[0] : fetchData;
        }
      }

      const response = await supabaseFetch(`client_requests?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Supabase PATCH error:', response.status, errorText);
        return res.status(500).json({ error: 'Failed to update request' });
      }

      const data = await response.json();
      const updatedTicket = Array.isArray(data) ? data[0] : data;

      // Send client email if status actually changed
      if (status && currentTicket && currentTicket.status !== status) {
        // Check dedup: only send if last_status_email_sent is null or >1 min ago
        const lastSent = currentTicket.last_status_email_sent
          ? new Date(currentTicket.last_status_email_sent).getTime()
          : 0;
        const now = Date.now();
        const oneMinute = 60 * 1000;

        if (!lastSent || (now - lastSent) > oneMinute) {
          // Update last_status_email_sent timestamp
          supabaseFetch(`client_requests?id=eq.${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ last_status_email_sent: new Date().toISOString() }),
          }).catch(err => console.error('Failed to update last_status_email_sent:', err));

          // Fire-and-forget: send status update email to client
          sendClientStatusEmail(updatedTicket, status, notes).catch(err => {
            console.error('Client status email failed:', err);
          });
        } else {
          console.log(`Skipping status email for ${updatedTicket.ticket_id} — sent ${Math.round((now - lastSent) / 1000)}s ago`);
        }
      }

      return res.status(200).json({ success: true, data: updatedTicket });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Client requests API error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

// ── Shared email styles ──
const EMAIL_STYLES = {
  fontFamily: 'Georgia, serif',
  maxWidth: '600px',
  brandColor: '#C8973A',
  inkColor: '#09131F',
  dimColor: '#888',
};

// ── Admin notification email (existing, refactored) ──
async function sendAdminNotificationEmail(request) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[MAIL] RESEND_API_KEY not configured - skipping admin email');
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const priorityColors = {
      low: '#6B7280',
      normal: '#3B82F6',
      high: '#F59E0B',
      urgent: '#EF4444',
    };

    const priorityColor = priorityColors[request.priority] || '#3B82F6';

    const result = await resend.emails.send({
    from: 'Hughey LLC <support@hugheyllc.com>',
    replyTo: 'support@hugheyllc.com',
    to: 'joe@joehughey.com',
    subject: `[${request.ticket_id}] New Client Request: ${request.request_type} — ${request.client_name}`,
      html: `
        <div style="font-family: ${EMAIL_STYLES.fontFamily}; max-width: ${EMAIL_STYLES.maxWidth}; color: ${EMAIL_STYLES.inkColor};">
          <h2 style="border-bottom: 2px solid ${EMAIL_STYLES.brandColor}; padding-bottom: 12px;">
            New Client Request — ${request.ticket_id}
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 130px;">Client</td><td>${escapeHtml(request.client_name)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Email</td><td><a href="mailto:${escapeHtml(request.email)}">${escapeHtml(request.email)}</a></td></tr>
            ${request.phone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Phone</td><td><a href="tel:${escapeHtml(request.phone)}">${escapeHtml(request.phone)}</a></td></tr>` : ''}
            <tr><td style="padding: 8px 0; font-weight: bold;">Type</td><td>${escapeHtml(request.request_type)}</td></tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Priority</td>
              <td><span style="display:inline-block;padding:3px 10px;border-radius:3px;background:${priorityColor};color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;">${escapeHtml(request.priority)}</span></td>
            </tr>
            ${request.due_date ? `<tr><td style="padding: 8px 0; font-weight: bold;">Due Date</td><td>${escapeHtml(request.due_date)}</td></tr>` : ''}
          </table>
          <div style="margin-top: 20px; background: #f9f6ef; border-left: 4px solid ${EMAIL_STYLES.brandColor}; padding: 16px;">
            <strong>Description:</strong><br /><br />
            ${escapeHtml(request.description).replace(/\n/g, '<br>')}
          </div>
          <p style="margin-top: 24px;">
            <a href="https://hugheyllc.com/admin/client-requests/" style="display:inline-block;padding:10px 24px;background:${EMAIL_STYLES.brandColor};color:${EMAIL_STYLES.inkColor};text-decoration:none;font-weight:700;border-radius:3px;">View Dashboard →</a>
          </p>
          <p style="margin-top: 16px; font-size: 12px; color: ${EMAIL_STYLES.dimColor};">
            Reply to ${escapeHtml(request.client_name)} at <a href="mailto:${escapeHtml(request.email)}">${escapeHtml(request.email)}</a>
          </p>
        </div>
      `,
    });
    console.log(`[MAIL] ✅ Admin email sent for ${request.ticket_id}`);
  } catch (err) {
    console.error(`[MAIL] ❌ Admin email failed for ${request.ticket_id}:`, err.message);
    // Don't rethrow - just log
  }
}

// ── Client confirmation email (new ticket submitted) ──
async function sendClientConfirmationEmail(request) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping client confirmation email');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const priorityLabels = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
  };

  const descriptionPreview = request.description.length > 200
    ? request.description.substring(0, 200) + '...'
    : request.description;

  await resend.emails.send({
    from: 'Hughey LLC <support@hugheyllc.com>',
    replyTo: 'support@hugheyllc.com',
    to: request.email,
    subject: `[${request.ticket_id}] Your request has been received`,
    html: `
      <div style="font-family: ${EMAIL_STYLES.fontFamily}; max-width: ${EMAIL_STYLES.maxWidth}; color: ${EMAIL_STYLES.inkColor};">
        <h2 style="border-bottom: 2px solid ${EMAIL_STYLES.brandColor}; padding-bottom: 12px; color: ${EMAIL_STYLES.inkColor};">
          We've Received Your Request
        </h2>
        <p style="font-size: 15px; line-height: 1.6; color: #333;">
          Thanks for submitting your request. We'll review it shortly and get back to you. Your ticket ID is <strong>${escapeHtml(request.ticket_id)}</strong>.
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px 0; font-weight: bold; width: 130px; color: ${EMAIL_STYLES.inkColor}; border-bottom: 1px solid #eee;">Ticket ID</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: ${EMAIL_STYLES.brandColor}; font-weight: bold;">${escapeHtml(request.ticket_id)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold; color: ${EMAIL_STYLES.inkColor}; border-bottom: 1px solid #eee;">Request Type</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${escapeHtml(request.request_type)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold; color: ${EMAIL_STYLES.inkColor}; border-bottom: 1px solid #eee;">Priority</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${escapeHtml(priorityLabels[request.priority] || request.priority)}</td>
          </tr>
        </table>

        <div style="margin-top: 20px; background: #f9f6ef; border-left: 4px solid ${EMAIL_STYLES.brandColor}; padding: 16px;">
          <strong style="color: ${EMAIL_STYLES.inkColor};">Your Request:</strong><br /><br />
          <span style="color: #555;">${escapeHtml(descriptionPreview).replace(/\n/g, '<br>')}</span>
        </div>

        <p style="font-size: 15px; line-height: 1.6; color: #333; margin-top: 24px;">
          We'll follow up with you directly once we've reviewed your request. No action is needed from you right now.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
        <p style="font-size: 12px; color: ${EMAIL_STYLES.dimColor};">
          Hughey LLC · Legal Marketing Consultancy<br />
          St. Petersburg, FL · <a href="https://hugheyllc.com" style="color: ${EMAIL_STYLES.brandColor};">hugheyllc.com</a>
        </p>
      </div>
    `,
    });
    console.log(`✅ Client email sent for ${request.ticket_id}:`, result.id);
  } catch (err) {
    console.error(`❌ Client email failed for ${request.ticket_id}:`, err.message, err);
  }
}

// ── Client status update email ──
async function sendClientStatusEmail(ticket, newStatus, latestNotes) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set — cannot send client status email');
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

  const statusLabels = {
    'open': 'Open',
    'in-progress': 'In Progress',
    'completed': 'Completed',
  };

  const statusMessages = {
    'open': "Your request has been reopened. We'll review it again shortly.",
    'in-progress': "We're actively working on your request. You'll hear from us soon.",
    'completed': "Your request has been completed. You should be hearing from us shortly.",
  };

  const statusColors = {
    'open': '#3B82F6',
    'in-progress': '#D97706',
    'completed': '#059669',
  };

  const statusLabel = statusLabels[newStatus] || newStatus;
  const statusMessage = statusMessages[newStatus] || `Your request status has been updated to: ${statusLabel}.`;
  const statusColor = statusColors[newStatus] || '#3B82F6';

  // Only include notes section if notes were provided in this update and aren't empty
  const notesSection = latestNotes && latestNotes.trim()
    ? `
      <div style="margin-top: 20px; background: #f9f6ef; border-left: 4px solid ${EMAIL_STYLES.brandColor}; padding: 16px;">
        <strong style="color: ${EMAIL_STYLES.inkColor};">Note from our team:</strong><br /><br />
        <span style="color: #555;">${escapeHtml(latestNotes).replace(/\n/g, '<br>')}</span>
      </div>
    `
    : '';

  await resend.emails.send({
    from: 'Hughey LLC <support@hugheyllc.com>',
    replyTo: 'support@hugheyllc.com',
    to: ticket.email,
    subject: `[${ticket.ticket_id}] Your request status: ${statusLabel}`,
    html: `
      <div style="font-family: ${EMAIL_STYLES.fontFamily}; max-width: ${EMAIL_STYLES.maxWidth}; color: ${EMAIL_STYLES.inkColor};">
        <h2 style="border-bottom: 2px solid ${EMAIL_STYLES.brandColor}; padding-bottom: 12px; color: ${EMAIL_STYLES.inkColor};">
          Request Status Update
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 10px 0; font-weight: bold; width: 130px; color: ${EMAIL_STYLES.inkColor}; border-bottom: 1px solid #eee;">Ticket ID</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: ${EMAIL_STYLES.brandColor}; font-weight: bold;">${escapeHtml(ticket.ticket_id)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold; color: ${EMAIL_STYLES.inkColor}; border-bottom: 1px solid #eee;">Request Type</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${escapeHtml(ticket.request_type)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold; color: ${EMAIL_STYLES.inkColor}; border-bottom: 1px solid #eee;">Status</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
              <span style="display:inline-block;padding:4px 12px;border-radius:4px;background:${statusColor};color:#fff;font-size:13px;font-weight:700;text-transform:uppercase;">${escapeHtml(statusLabel)}</span>
            </td>
          </tr>
        </table>

        <p style="font-size: 15px; line-height: 1.6; color: #333; margin-top: 24px;">
          ${statusMessage}
        </p>

        ${notesSection}

        <p style="font-size: 14px; line-height: 1.6; color: #555; margin-top: 24px;">
          If you have any questions, feel free to reply to this email or reach out to us directly.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
        <p style="font-size: 12px; color: ${EMAIL_STYLES.dimColor};">
          Hughey LLC · Legal Marketing Consultancy<br />
          St. Petersburg, FL · <a href="https://hugheyllc.com" style="color: ${EMAIL_STYLES.brandColor};">hugheyllc.com</a>
        </p>
      </div>
    `,
    });
    console.log(`✅ Status email sent for ${ticket.ticket_id}:`, result.id);
  } catch (err) {
    console.error(`❌ Status email failed for ${ticket.ticket_id}:`, err.message, err);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
