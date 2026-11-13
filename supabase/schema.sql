-- Run once in Supabase Dashboard > SQL Editor.

-- 1) Tables ---------------------------------------------------------------
create table if not exists coding_projects (
  id text primary key,
  title text not null,
  year text,
  kind text,
  tags text[] not null default '{}',
  description text,
  link text,
  cover jsonb,                       -- {"type":"upload","src":"uploads/x.webp"} | {"type":"url","src":"https://..."}
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists design_works (
  id text primary key,
  title text not null,
  year text,
  kind text,
  tags text[] not null default '{}',
  hue int,
  ratio text default '1/1',
  cover jsonb,
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists learning_topics (
  id text primary key,
  topic text not null,
  note text,
  stage text not null default 'next' check (stage in ('now','done','next')),
  level int not null default 0 check (level between 0 and 100),
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- 2) Owner check ----------------------------------------------------------
-- Only Google accounts whose email is listed here may write. The table has no policy,
-- so nobody can read or edit it through the API (use the SQL Editor).
create table if not exists owner (email text primary key);
alter table owner enable row level security;

create or replace function is_owner() returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from owner where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))) $$;

-- 3) Row Level Security ---------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['coding_projects','design_works','learning_topics'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "read published" on %I', t);
    execute format('drop policy if exists "owner write" on %I', t);
    execute format($p$create policy "read published" on %I for select using (status = 'published' or is_owner())$p$, t);
    execute format($p$create policy "owner write" on %I for all using (is_owner()) with check (is_owner())$p$, t);
  end loop;
end $$;

-- 4) Storage: public-read bucket, owner-only writes -----------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp','image/png','image/jpeg','image/gif'])
on conflict (id) do nothing;

drop policy if exists "owner upload" on storage.objects;
drop policy if exists "owner update" on storage.objects;
drop policy if exists "owner delete" on storage.objects;
create policy "owner upload" on storage.objects for insert with check (bucket_id = 'media' and is_owner());
create policy "owner update" on storage.objects for update using (bucket_id = 'media' and is_owner());
create policy "owner delete" on storage.objects for delete using (bucket_id = 'media' and is_owner());

-- 5) Register your Gmail as the owner:
--    insert into owner (email) values ('you@gmail.com');
