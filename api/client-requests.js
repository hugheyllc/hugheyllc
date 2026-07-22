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

      // Fire-and-forget email notification
      sendNotificationEmail(ticket).catch(err => {
        console.error('Email notification failed:', err);
      });

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
      return res.status(200).json({ success: true, data: Array.isArray(data) ? data[0] : data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Client requests API error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

// ── Email notification ──
async function sendNotificationEmail(request) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email notification');
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const priorityColors = {
    low: '#6B7280',
    normal: '#3B82F6',
    high: '#F59E0B',
    urgent: '#EF4444',
  };

  const priorityColor = priorityColors[request.priority] || '#3B82F6';

  await resend.emails.send({
    from: 'Hughey LLC <no-reply@notifications.hugheyllc.com>',
    to: 'joe@joehughey.com',
    subject: `[${request.ticket_id}] New Client Request: ${request.request_type} — ${request.client_name}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; color: #09131F;">
        <h2 style="border-bottom: 2px solid #C8973A; padding-bottom: 12px;">
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
        <div style="margin-top: 20px; background: #f9f6ef; border-left: 4px solid #C8973A; padding: 16px;">
          <strong>Description:</strong><br /><br />
          ${escapeHtml(request.description).replace(/\n/g, '<br>')}
        </div>
        <p style="margin-top: 24px;">
          <a href="https://hugheyllc.com/admin/client-requests/" style="display:inline-block;padding:10px 24px;background:#C8973A;color:#09131F;text-decoration:none;font-weight:700;border-radius:3px;">View Dashboard →</a>
        </p>
        <p style="margin-top: 16px; font-size: 12px; color: #888;">
          Reply to ${escapeHtml(request.client_name)} at <a href="mailto:${escapeHtml(request.email)}">${escapeHtml(request.email)}</a>
        </p>
      </div>
    `,
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
