# Client Request Portal — Setup Guide

## Overview
Password-protected client request form + admin dashboard for Hughey LLC.

- **Form:** `/client-requests/` — clients submit service requests
- **Dashboard:** `/admin/client-requests/` — Joe manages/tracks requests
- **API:** `/api/client-requests` — Vercel Serverless Function

## 1. Supabase Setup

### Create Project (if needed)
1. Go to [supabase.com](https://supabase.com) → Create new project
2. Choose a region (US East recommended)
3. Note your project URL and keys

### Run Migration
Copy the contents of `supabase/migrations/001_client_requests.sql` and run it in:
**Supabase Dashboard → SQL Editor → New Query → Paste → Run**

This creates:
- `client_requests` table with all fields
- Auto-incrementing ticket IDs (HLC-1000, HLC-1001, ...)
- Auto-updating `updated_at` timestamps
- Indexes for fast queries
- RLS policies for service role access

## 2. Environment Variables

Add these to **Vercel Project Settings → Environment Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (NOT anon key) | `eyJ...` |
| `RESEND_API_KEY` | Already configured | *(existing)* |
| `CLIENT_PORTAL_PASSWORD` | Portal access code | `hughey2025` |

### Where to find Supabase keys:
**Supabase Dashboard → Settings → API**
- **Project URL** → `SUPABASE_URL`
- **service_role key** (under "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ Use the `service_role` key, NOT the `anon` key. The service role bypasses RLS.

## 3. Portal Password

Default password: `hughey2025`

To change it, update the `CLIENT_PORTAL_PASSWORD` environment variable in Vercel.
The same password is used for both the form and dashboard.

## 4. Deploy

Just push to the main branch — Vercel auto-deploys. No Astro config changes needed (site stays static, API runs as serverless functions).

## Architecture

```
/client-requests/          → Static HTML (password gate → form)
/admin/client-requests/    → Static HTML (password gate → dashboard)
/api/client-requests       → Vercel Serverless Function (POST/GET/PATCH)
```

- **Auth:** Simple password via `X-Portal-Password` header
- **Data:** Supabase (PostgreSQL)
- **Email:** Resend (sends Joe a notification on new requests)
- **SEO:** Both pages are `noindex`, excluded from sitemap

## Features

### Request Form
- Client name, email, phone, request type, description, priority, due date
- Success screen shows ticket ID (HLC-XXXX)
- Email notification sent to joe@joehughey.com

### Admin Dashboard
- Stats bar (total, open, in-progress, completed)
- Filterable table (status, priority, search)
- Sortable columns (click headers)
- Click any row → detail modal with full info
- Inline status updates (dropdown in table)
- Notes field for internal tracking
- Responsive (works on mobile)

### Request Types
Website Update, SEO / Content, Google Ads, Social Media, Analytics / Reporting, Intake Optimization, Strategy Review, Design / Creative, Technical Issue, Other

### Priority Levels
Low, Normal, High, Urgent (color-coded throughout)
