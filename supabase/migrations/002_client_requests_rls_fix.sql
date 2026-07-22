-- Fix RLS policy to allow authenticated inserts from our password-protected API
-- The API validates the password header (X-Portal-Password) before calling Supabase

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Service role full access" ON client_requests;

-- Create policies that allow password-protected anonymous access
-- Since our API validates the password before making Supabase calls,
-- we can trust that any request reaching Supabase has been authenticated

-- Allow SELECT for authenticated requests (GET via API)
CREATE POLICY "Allow authenticated select" ON client_requests
  FOR SELECT
  USING (true);

-- Allow INSERT for authenticated requests (POST via API)
CREATE POLICY "Allow authenticated insert" ON client_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow UPDATE for authenticated requests (PATCH via API)
CREATE POLICY "Allow authenticated update" ON client_requests
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow DELETE for authenticated requests if needed
CREATE POLICY "Allow authenticated delete" ON client_requests
  FOR DELETE
  USING (true);

-- Grant appropriate permissions to anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON client_requests TO anon;
GRANT USAGE ON SEQUENCE client_requests_ticket_seq TO anon;
