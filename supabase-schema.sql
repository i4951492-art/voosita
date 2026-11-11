-- Run once in Supabase: SQL Editor -> New query -> Run

-- 1. Profiles: one row per user, created automatically at sign-up
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read and edit only their own profile
create policy "profile: read own" on public.profiles
  for select using (auth.uid() = id);

create policy "profile: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Nobody can change their own role from the browser
revoke update (role) on public.profiles from authenticated, anon;

-- 2. Create a profile automatically when someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Make yourself admin AFTER you register once on the site.
--    Replace the email with the one you registered with.
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'ВАШ_EMAIL@example.com');
