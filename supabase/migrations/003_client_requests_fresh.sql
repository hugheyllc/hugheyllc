-- Client Requests Ticketing System — Fresh Build
-- Replaces 001 & 002 migrations
-- Run this in the Supabase SQL Editor (or it has been auto-applied)

-- Clean slate
DROP TABLE IF EXISTS client_requests CASCADE;
DROP SEQUENCE IF EXISTS client_requests_ticket_seq CASCADE;
DROP FUNCTION IF EXISTS generate_ticket_id() CASCADE;

-- Create the client_requests table
CREATE TABLE client_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id TEXT UNIQUE NOT NULL DEFAULT '',
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

-- Sequence for ticket IDs: HLC-1000, HLC-1001, ...
CREATE SEQUENCE client_requests_ticket_seq START 1000;

-- Auto-generate ticket_id on insert
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_id := 'HLC-' || nextval('client_requests_ticket_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_id
  BEFORE INSERT ON client_requests
  FOR EACH ROW
  WHEN (NEW.ticket_id IS NULL OR NEW.ticket_id = '')
  EXECUTE FUNCTION generate_ticket_id();

-- Auto-update updated_at on update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON client_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_client_requests_status ON client_requests(status);
CREATE INDEX idx_client_requests_priority ON client_requests(priority);
CREATE INDEX idx_client_requests_created_at ON client_requests(created_at DESC);
CREATE INDEX idx_client_requests_ticket_id ON client_requests(ticket_id);

-- Row Level Security
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;

-- Allow all operations (API validates password before calling Supabase)
CREATE POLICY "Allow all operations" ON client_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grants
GRANT ALL ON client_requests TO service_role;
GRANT ALL ON client_requests TO anon;
GRANT ALL ON client_requests TO authenticated;
GRANT USAGE ON SEQUENCE client_requests_ticket_seq TO service_role;
GRANT USAGE ON SEQUENCE client_requests_ticket_seq TO anon;
GRANT USAGE ON SEQUENCE client_requests_ticket_seq TO authenticated;
