-- Migration: Add last_status_email_sent to client_requests
-- Purpose: Track when the last status-change email was sent to prevent duplicates
-- Run this in Supabase SQL Editor

ALTER TABLE client_requests
ADD COLUMN IF NOT EXISTS last_status_email_sent TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN client_requests.last_status_email_sent IS 'Timestamp of last status-change email sent to client. Used for deduplication (1-min cooldown).';
