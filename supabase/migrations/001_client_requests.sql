-- Client Requests Tracking System
-- Run this in the Supabase SQL Editor

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

-- Enable Row Level Security (but allow service role full access)
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;

-- Policy: service_role can do everything (our API uses service key)
CREATE POLICY "Service role full access" ON client_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant access to the service role
GRANT ALL ON client_requests TO service_role;
GRANT USAGE ON SEQUENCE client_requests_ticket_seq TO service_role;
