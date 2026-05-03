-- Run in Supabase SQL Editor if you do not use the CLI migrator.
-- Stores emails collected from the app for manual follow-up (no transactional email).

create table if not exists public.contact_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null,
  framework text,
  detail text,
  created_at timestamptz not null default now()
);

comment on table public.contact_leads is 'Inbound emails: waitlist, uploads, auth forms. Queried manually in Supabase Table Editor.';

create index if not exists contact_leads_email_idx on public.contact_leads (email);
create index if not exists contact_leads_created_at_idx on public.contact_leads (created_at desc);
create index if not exists contact_leads_source_idx on public.contact_leads (source);

alter table public.contact_leads enable row level security;

-- If you created this table earlier without `detail`, run:
-- alter table public.contact_leads add column if not exists detail text;

-- Inserts use SUPABASE_SERVICE_ROLE_KEY from the Next.js server (bypasses RLS).
-- Optional: add a read policy for your team role only.
