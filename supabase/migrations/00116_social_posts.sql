create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  content text not null,
  posted_at timestamptz not null default now(),
  external_id text,
  created_at timestamptz not null default now()
);

grant select, insert on public.social_posts to service_role;
alter table public.social_posts enable row level security;
-- service_role bypasses RLS
