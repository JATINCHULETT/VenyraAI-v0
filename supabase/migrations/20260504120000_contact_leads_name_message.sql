-- Optional columns for landing / contact form (run in SQL Editor if not using CLI migrator).

alter table public.contact_leads add column if not exists name text;
alter table public.contact_leads add column if not exists company text;
alter table public.contact_leads add column if not exists message text;

comment on column public.contact_leads.name is 'Contact name (e.g. landing form).';
comment on column public.contact_leads.company is 'Company or org (optional).';
comment on column public.contact_leads.message is 'Free-text message from contact form.';
