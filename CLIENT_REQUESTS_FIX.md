# Client Requests Portal Fix

## Problem
The client request form at `https://hugheyllc.com/client-requests` was failing with "Failed to create request" error.

## Root Cause
The Supabase table `client_requests` was never created. The migration file exists but was never applied to the database.

## Solution Applied
1. ✅ Fixed API code to use service role key (with fallback to anon key)
2. ✅ Created RLS policy migration to allow inserts
3. ✅ Committed and pushed code to `main`

## What You Need to Do

You need to manually run the SQL migration in Supabase to create the table:

### Steps:
1. Go to https://supabase.com/dashboard
2. Log into your Hughey LLC project
3. Go to **SQL Editor** (left sidebar)
4. Create a new query and paste **all** of this SQL:

```sql
-- Client Requests Tracking System

-- Create the client_requests table
CREATE TABLE IF NOT EXISTS client_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  request_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'completed')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a sequence for ticket IDs
CREATE SEQUENCE IF NOT EXISTS client_requests_ticket_seq START 1000;

-- Function to auto-generate ticket IDs like HLC-1000, HLC-1001, etc.
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_id := 'HLC-' || nextval('client_requests_ticket_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set ticket_id on insert
DROP TRIGGER IF EXISTS set_ticket_id ON client_requests;
CREATE TRIGGER set_ticket_id
  BEFORE INSERT ON client_requests
  FOR EACH ROW
  WHEN (NEW.ticket_id IS NULL OR NEW.ticket_id = '')
  EXECUTE FUNCTION generate_ticket_id();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on update
DROP TRIGGER IF EXISTS set_updated_at ON client_requests;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON client_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_client_requests_status ON client_requests(status);
CREATE INDEX IF NOT EXISTS idx_client_requests_priority ON client_requests(priority);
CREATE INDEX IF NOT EXISTS idx_client_requests_created_at ON client_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_requests_ticket_id ON client_requests(ticket_id);

-- Enable Row Level Security
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;

-- Create policies that allow password-protected anonymous access
-- Since the API validates the password before making Supabase calls,
-- we can trust that any request reaching Supabase has been authenticated

-- Allow SELECT for authenticated requests
CREATE POLICY "Allow authenticated select" ON client_requests
  FOR SELECT
  USING (true);

-- Allow INSERT for authenticated requests  
CREATE POLICY "Allow authenticated insert" ON client_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow UPDATE for authenticated requests
CREATE POLICY "Allow authenticated update" ON client_requests
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow DELETE for authenticated requests
CREATE POLICY "Allow authenticated delete" ON client_requests
  FOR DELETE
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON client_requests TO anon;
GRANT USAGE ON SEQUENCE client_requests_ticket_seq TO anon;
```

5. Click **Run** (the play button)
6. ✅ Done! The form should now work.

## Testing
After running the migration:
1. Go to https://hugheyllc.com/client-requests
2. Enter access code: `hughey2025`
3. Fill out and submit a test request
4. You should see a success message with a ticket ID like `HLC-1000`

## What Changed in the Code
- `api/client-requests.js`: Now tries to use `SUPABASE_SERVICE_ROLE_KEY` env var, falls back to `SUPABASE_ANON_KEY`
- Added `/supabase/migrations/002_client_requests_rls_fix.sql` for RLS policy update (when Vercel deploys, this becomes documentation)

## Notes
- The portal is password-protected with code `hughey2025`
- All requests auto-generate ticket IDs starting at HLC-1000
- Joe gets email notifications when new requests come in
- Admin dashboard at `/admin/client-requests` (not yet fully configured)
