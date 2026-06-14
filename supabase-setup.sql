create extension if not exists pgcrypto;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  message text not null check (char_length(message) between 5 and 800),
  admin_reply text check (admin_reply is null or char_length(admin_reply) <= 1200),
  visible boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  replied_at timestamptz
);

alter table public.feedback enable row level security;

drop policy if exists "Public can read visible feedback" on public.feedback;
create policy "Public can read visible feedback"
on public.feedback for select to anon, authenticated
using (visible = true or auth.role() = 'authenticated');

drop policy if exists "Public can submit feedback" on public.feedback;
create policy "Public can submit feedback"
on public.feedback for insert to anon
with check (visible = true and featured = false and admin_reply is null and replied_at is null);

drop policy if exists "Authenticated team can update feedback" on public.feedback;
create policy "Authenticated team can update feedback"
on public.feedback for update to authenticated
using (true) with check (true);

create index if not exists feedback_visible_created_idx on public.feedback (visible, created_at desc);
create index if not exists feedback_featured_created_idx on public.feedback (featured, created_at desc);
