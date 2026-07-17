import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const VALID_PASSWORD = process.env.CLIENT_PORTAL_PASSWORD || 'hughey2025';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function checkAuth(password) {
  return password === VALID_PASSWORD;
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

  const password = req.headers['x-portal-password'] || '';
  if (!checkAuth(password)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabase();

  try {
    if (req.method === 'POST') {
      const { client_name, email, phone, request_type, description, priority, due_date } = req.body;

      if (!client_name || !email || !request_type || !description) {
        return res.status(400).json({
          error: 'Missing required fields: client_name, email, request_type, description',
        });
      }

      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      const finalPriority = validPriorities.includes(priority) ? priority : 'normal';

      const { data, error } = await supabase
        .from('client_requests')
        .insert({
          client_name,
          email,
          phone: phone || null,
          request_type,
          description,
          priority: finalPriority,
          due_date: due_date || null,
          status: 'open',
          notes: '',
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to create request', details: error.message });
      }

      // Email notification (non-blocking)
      sendNotificationEmail(data).catch(err => {
        console.error('Email notification failed:', err);
      });

      return res.status(201).json({
        success: true,
        ticket_id: data.ticket_id,
        message: `Request created successfully. Your ticket ID is ${data.ticket_id}.`,
      });
    }

    if (req.method === 'GET') {
      const { status, priority, search, id } = req.query;

      if (id) {
        const { data, error } = await supabase
          .from('client_requests')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          return res.status(404).json({ error: 'Request not found' });
        }
        return res.status(200).json(data);
      }

      let query = supabase.from('client_requests').select('*').order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (priority && priority !== 'all') {
        query = query.eq('priority', priority);
      }

      if (search) {
        query = query.or(
          `client_name.ilike.%${search}%,email.ilike.%${search}%,ticket_id.ilike.%${search}%,description.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch requests' });
      }

      return res.status(200).json(data || []);
    }

    if (req.method === 'PATCH') {
      const { id, status, notes } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Missing request id' });
      }

      const updates = {};
      if (status) {
        const validStatuses = ['open', 'in-progress', 'completed'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }
        updates.status = status;
      }

      if (notes !== undefined) {
        updates.notes = notes;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      const { data, error } = await supabase
        .from('client_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return res.status(500).json({ error: 'Failed to update request' });
      }

      return res.status(200).json({ success: true, data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Client requests API error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

async function sendNotificationEmail(request) {
  if (!process.env.RESEND_API_KEY) return;

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
          <tr><td style="padding: 8px 0; font-weight: bold; width: 130px;">Client</td><td>${request.client_name}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Email</td><td><a href="mailto:${request.email}">${request.email}</a></td></tr>
          ${request.phone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Phone</td><td><a href="tel:${request.phone}">${request.phone}</a></td></tr>` : ''}
          <tr><td style="padding: 8px 0; font-weight: bold;">Type</td><td>${request.request_type}</td></tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Priority</td>
            <td><span style="display:inline-block;padding:3px 10px;border-radius:3px;background:${priorityColor};color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;">${request.priority}</span></td>
          </tr>
          ${request.due_date ? `<tr><td style="padding: 8px 0; font-weight: bold;">Due Date</td><td>${request.due_date}</td></tr>` : ''}
        </table>
        <div style="margin-top: 20px; background: #f9f6ef; border-left: 4px solid #C8973A; padding: 16px;">
          <strong>Description:</strong><br /><br />
          ${request.description.replace(/\n/g, '<br>')}
        </div>
        <p style="margin-top: 24px;">
          <a href="https://hugheyllc.com/admin/client-requests/" style="display:inline-block;padding:10px 24px;background:#C8973A;color:#09131F;text-decoration:none;font-weight:700;border-radius:3px;">View Dashboard →</a>
        </p>
        <p style="margin-top: 16px; font-size: 12px; color: #888;">
          Reply to ${request.client_name} at <a href="mailto:${request.email}">${request.email}</a>
        </p>
      </div>
    `,
  });
}
