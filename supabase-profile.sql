-- Run once in Supabase: SQL Editor -> New query -> Run (after supabase-schema.sql)

-- 1. Profile fields
alter table public.profiles
  add column if not exists goals text[] not null default '{}',
  add column if not exists city text,
  add column if not exists bio text,
  add column if not exists skills text[] not null default '{}',
  add column if not exists experience_years int,
  add column if not exists price_from bigint,
  add column if not exists price_to bigint,
  add column if not exists photo_urls text[] not null default '{}',
  add column if not exists is_public boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles drop constraint if exists profiles_goals_valid;
alter table public.profiles add constraint profiles_goals_valid
  check (goals <@ array['job_seeker','employer','service_provider','service_client','renter','landlord']::text[]);

alter table public.profiles drop constraint if exists profiles_bio_len;
alter table public.profiles add constraint profiles_bio_len check (char_length(bio) <= 1000);

alter table public.profiles drop constraint if exists profiles_experience_range;
alter table public.profiles add constraint profiles_experience_range
  check (experience_years is null or experience_years between 0 and 60);

alter table public.profiles drop constraint if exists profiles_price_positive;
alter table public.profiles add constraint profiles_price_positive
  check ((price_from is null or price_from >= 0) and (price_to is null or price_to >= 0));

-- 2. Logged-in users can read public profiles of others (anonymous visitors cannot)
drop policy if exists "profile: read public" on public.profiles;
create policy "profile: read public" on public.profiles
  for select to authenticated using (is_public = true);

-- 3. Photo storage: anyone can view, each user can upload and delete only in their own folder
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

drop policy if exists "photos: public read" on storage.objects;
create policy "photos: public read" on storage.objects
  for select using (bucket_id = 'profile-photos');

drop policy if exists "photos: upload own" on storage.objects;
create policy "photos: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "photos: delete own" on storage.objects;
create policy "photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
