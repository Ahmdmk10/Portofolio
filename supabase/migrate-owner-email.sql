-- Only needed if you already ran an older schema.sql that used owner(uid).
drop table if exists owner;
create table owner (email text primary key);
alter table owner enable row level security;

create or replace function is_owner() returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from owner where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))) $$;

-- insert into owner (email) values ('you@gmail.com');
