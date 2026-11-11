-- ============================================================================
-- VOOSITA platform: run ONCE in Supabase -> SQL Editor -> New query -> Run
-- Run AFTER supabase-schema.sql (supabase-profile.sql is optional: this file adds the same columns)
-- ============================================================================

-- ---------- 0. Security fix for profiles ------------------------------------
-- The earlier "revoke update (role)" did not work: the table-level UPDATE grant
-- still allowed a user to change their own role. Here we revoke it properly and
-- allow only the safe columns.
alter table public.profiles
  add column if not exists banned boolean not null default false,
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

revoke update on public.profiles from authenticated, anon;
grant update (name, phone, city, bio, goals, skills, experience_years,
              price_from, price_to, photo_urls, is_public, updated_at)
  on public.profiles to authenticated;

-- Other users must not read full profiles (phone, role). Public data goes through
-- the public_profiles view below.
drop policy if exists "profile: read public" on public.profiles;

-- ---------- 1. Helper functions ---------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'admin' and not banned);
$$;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and not banned);
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_active_user() to anon, authenticated;

drop policy if exists "profile: admin read" on public.profiles;
create policy "profile: admin read" on public.profiles
  for select to authenticated using (public.is_admin());

-- ---------- 2. Listings ------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('job', 'service', 'housing')),
  category text,
  title text not null check (char_length(title) between 3 and 120),
  description text check (char_length(description) <= 3000),
  city text,
  price bigint check (price >= 0),
  rooms int check (rooms between 0 and 20),
  deal text check (deal in ('rent', 'sale')),
  photo_urls text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists listings_type_created on public.listings (type, created_at desc);
create index if not exists listings_owner on public.listings (owner_id);

alter table public.listings enable row level security;

drop policy if exists "listings: read active" on public.listings;
create policy "listings: read active" on public.listings
  for select to anon, authenticated using (status = 'active');

drop policy if exists "listings: read own" on public.listings;
create policy "listings: read own" on public.listings
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "listings: admin read" on public.listings;
create policy "listings: admin read" on public.listings
  for select to authenticated using (public.is_admin());

drop policy if exists "listings: insert own" on public.listings;
create policy "listings: insert own" on public.listings
  for insert to authenticated
  with check (owner_id = auth.uid() and public.is_active_user() and status in ('active', 'hidden'));

drop policy if exists "listings: update own" on public.listings;
create policy "listings: update own" on public.listings
  for update to authenticated
  using (owner_id = auth.uid() and status <> 'removed' and public.is_active_user())
  with check (owner_id = auth.uid() and status in ('active', 'hidden'));
-- a listing removed by a moderator cannot be restored by its owner

drop policy if exists "listings: admin update" on public.listings;
create policy "listings: admin update" on public.listings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "listings: delete own or admin" on public.listings;
create policy "listings: delete own or admin" on public.listings
  for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

revoke update on public.listings from authenticated, anon;
grant update (category, title, description, city, price, rooms, deal, photo_urls, status, updated_at)
  on public.listings to authenticated;

-- Anti-spam: at most 30 listings per user
create or replace function public.limit_listings() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.listings where owner_id = new.owner_id) >= 30 then
    raise exception 'LISTING_LIMIT';
  end if;
  return new;
end $$;
drop trigger if exists listings_limit on public.listings;
create trigger listings_limit before insert on public.listings
  for each row execute function public.limit_listings();

-- ---------- 3. Blocks (a user blocks another user) ---------------------------
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;

drop policy if exists "blocks: read own" on public.blocks;
create policy "blocks: read own" on public.blocks
  for select to authenticated using (blocker_id = auth.uid());

drop policy if exists "blocks: insert own" on public.blocks;
create policy "blocks: insert own" on public.blocks
  for insert to authenticated with check (blocker_id = auth.uid() and public.is_active_user());

drop policy if exists "blocks: delete own" on public.blocks;
create policy "blocks: delete own" on public.blocks
  for delete to authenticated using (blocker_id = auth.uid());

create or replace function public.is_blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks
                 where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;

-- ---------- 4. Chats ---------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct', 'support')),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  last_message text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check ((kind = 'direct' and user_b is not null and user_a <> user_b)
      or (kind = 'support' and user_b is null))
);
create unique index if not exists conversations_pair
  on public.conversations (least(user_a, user_b), greatest(user_a, user_b))
  where kind = 'direct';
create unique index if not exists conversations_support
  on public.conversations (user_a) where kind = 'support';

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_conv_created on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create or replace function public.can_access_conversation(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversations c
    where c.id = cid
      and (c.user_a = auth.uid() or c.user_b = auth.uid()
           or (c.kind = 'support' and public.is_admin()))
  );
$$;

create or replace function public.can_send_in_conversation(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_active_user() and exists (
    select 1 from public.conversations c
    where c.id = cid
      and (
        (c.kind = 'direct' and (c.user_a = auth.uid() or c.user_b = auth.uid())
           and not public.is_blocked_between(c.user_a, c.user_b))
        or (c.kind = 'support' and (c.user_a = auth.uid() or public.is_admin()))
      )
  );
$$;

grant execute on function public.can_access_conversation(uuid) to authenticated;
grant execute on function public.can_send_in_conversation(uuid) to authenticated;

drop policy if exists "conv: read" on public.conversations;
create policy "conv: read" on public.conversations
  for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid() or (kind = 'support' and public.is_admin()));

drop policy if exists "conv: insert" on public.conversations;
create policy "conv: insert" on public.conversations
  for insert to authenticated
  with check (
    public.is_active_user() and user_a = auth.uid() and (
      (kind = 'direct' and user_b is not null and user_b <> auth.uid()
         and not public.is_blocked_between(auth.uid(), user_b))
      or (kind = 'support' and user_b is null)
    )
  );

drop policy if exists "msg: read" on public.messages;
create policy "msg: read" on public.messages
  for select to authenticated using (public.can_access_conversation(conversation_id));

drop policy if exists "msg: insert" on public.messages;
create policy "msg: insert" on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.can_send_in_conversation(conversation_id));

-- Only the receiver may mark messages as read, and only the read_at column changes
drop policy if exists "msg: mark read" on public.messages;
create policy "msg: mark read" on public.messages
  for update to authenticated
  using (public.can_access_conversation(conversation_id) and sender_id <> auth.uid())
  with check (public.can_access_conversation(conversation_id) and sender_id <> auth.uid());

revoke update on public.messages from authenticated, anon;
grant update (read_at) on public.messages to authenticated;

create or replace function public.touch_conversation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
     set last_message = left(new.body, 140), last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end $$;
drop trigger if exists messages_touch on public.messages;
create trigger messages_touch after insert on public.messages
  for each row execute function public.touch_conversation();

-- ---------- 5. Reviews -------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text check (char_length(body) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (author_id, target_id),
  check (author_id <> target_id)
);
alter table public.reviews enable row level security;

drop policy if exists "reviews: read all" on public.reviews;
create policy "reviews: read all" on public.reviews
  for select to anon, authenticated using (true);

-- A review is allowed only after the two users have a chat together
drop policy if exists "reviews: insert after chat" on public.reviews;
create policy "reviews: insert after chat" on public.reviews
  for insert to authenticated
  with check (
    author_id = auth.uid() and public.is_active_user() and exists (
      select 1 from public.conversations c
      where c.kind = 'direct'
        and ((c.user_a = auth.uid() and c.user_b = target_id)
          or (c.user_b = auth.uid() and c.user_a = target_id))
    )
  );

drop policy if exists "reviews: update own" on public.reviews;
create policy "reviews: update own" on public.reviews
  for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "reviews: delete own or admin" on public.reviews;
create policy "reviews: delete own or admin" on public.reviews
  for delete to authenticated using (author_id = auth.uid() or public.is_admin());

revoke update on public.reviews from authenticated, anon;
grant update (rating, body, updated_at) on public.reviews to authenticated;

-- ---------- 6. Public profile view (no phone, no role) -----------------------
-- Runs with the view owner's rights on purpose: it exposes only safe columns.
-- Supabase may show a "Security Definer View" notice. That is expected here.
create or replace view public.public_profiles as
select
  p.id,
  p.name,
  case when p.is_public then p.city end as city,
  case when p.is_public then p.bio end as bio,
  case when p.is_public then p.goals else '{}'::text[] end as goals,
  case when p.is_public then p.skills else '{}'::text[] end as skills,
  case when p.is_public then p.experience_years end as experience_years,
  case when p.is_public then p.price_from end as price_from,
  case when p.is_public then p.price_to end as price_to,
  case when p.is_public then p.photo_urls else '{}'::text[] end as photo_urls,
  p.is_public,
  p.created_at,
  coalesce(r.avg_rating, 0)::numeric(3, 2) as rating_avg,
  coalesce(r.cnt, 0)::int as reviews_count
from public.profiles p
left join (
  select target_id, avg(rating) as avg_rating, count(*) as cnt
  from public.reviews group by target_id
) r on r.target_id = p.id
where not p.banned;

grant select on public.public_profiles to anon, authenticated;

-- ---------- 7. Favorites -----------------------------------------------------
create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
alter table public.favorites enable row level security;

drop policy if exists "fav: read own" on public.favorites;
create policy "fav: read own" on public.favorites
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "fav: insert own" on public.favorites;
create policy "fav: insert own" on public.favorites
  for insert to authenticated with check (user_id = auth.uid() and public.is_active_user());
drop policy if exists "fav: delete own" on public.favorites;
create policy "fav: delete own" on public.favorites
  for delete to authenticated using (user_id = auth.uid());

-- ---------- 8. Reports (complaints) ------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  reason text not null check (reason in ('spam', 'fraud', 'abuse', 'fake', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  check (target_user_id is not null or listing_id is not null)
);
alter table public.reports enable row level security;

drop policy if exists "reports: insert own" on public.reports;
create policy "reports: insert own" on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid() and public.is_active_user() and status = 'open');

drop policy if exists "reports: admin read" on public.reports;
create policy "reports: admin read" on public.reports
  for select to authenticated using (public.is_admin());

drop policy if exists "reports: admin update" on public.reports;
create policy "reports: admin update" on public.reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

revoke update on public.reports from authenticated, anon;
grant update (status) on public.reports to authenticated;

create or replace function public.limit_reports() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.reports
      where reporter_id = new.reporter_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'REPORT_LIMIT';
  end if;
  return new;
end $$;
drop trigger if exists reports_limit on public.reports;
create trigger reports_limit before insert on public.reports
  for each row execute function public.limit_reports();

-- ---------- 9. Ads (managed by admin) ----------------------------------------
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  slot text not null check (slot in ('home', 'jobs', 'services', 'housing', 'search')),
  title text not null check (char_length(title) between 1 and 120),
  body text check (char_length(body) <= 300),
  image_url text,
  link_url text check (link_url is null or link_url ~* '^https?://'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.ads enable row level security;

drop policy if exists "ads: read active" on public.ads;
create policy "ads: read active" on public.ads
  for select to anon, authenticated using (active = true or public.is_admin());

drop policy if exists "ads: admin insert" on public.ads;
create policy "ads: admin insert" on public.ads
  for insert to authenticated with check (public.is_admin());
drop policy if exists "ads: admin update" on public.ads;
create policy "ads: admin update" on public.ads
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "ads: admin delete" on public.ads;
create policy "ads: admin delete" on public.ads
  for delete to authenticated using (public.is_admin());

-- ---------- 10. Site settings (About page texts, contact email) --------------
create table if not exists public.site_settings (
  key text primary key,
  value text not null check (char_length(value) <= 20000),
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

drop policy if exists "settings: read all" on public.site_settings;
create policy "settings: read all" on public.site_settings
  for select to anon, authenticated using (true);
drop policy if exists "settings: admin insert" on public.site_settings;
create policy "settings: admin insert" on public.site_settings
  for insert to authenticated with check (public.is_admin());
drop policy if exists "settings: admin update" on public.site_settings;
create policy "settings: admin update" on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "settings: admin delete" on public.site_settings;
create policy "settings: admin delete" on public.site_settings
  for delete to authenticated using (public.is_admin());

-- ---------- 11. Admin: ban and unban a user ----------------------------------
create or replace function public.admin_set_ban(target uuid, flag boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;
  update public.profiles set banned = flag where id = target and role <> 'admin';
  if flag then
    update public.listings set status = 'hidden' where owner_id = target and status = 'active';
  end if;
end $$;
revoke all on function public.admin_set_ban(uuid, boolean) from public, anon;
grant execute on function public.admin_set_ban(uuid, boolean) to authenticated;

-- ---------- 12. Storage buckets ----------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('profile-photos', 'profile-photos', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('ads', 'ads', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "listing photos: read" on storage.objects;
create policy "listing photos: read" on storage.objects
  for select using (bucket_id = 'listing-photos');
drop policy if exists "listing photos: upload own" on storage.objects;
create policy "listing photos: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text
              and public.is_active_user());
drop policy if exists "listing photos: delete own" on storage.objects;
create policy "listing photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "ads images: read" on storage.objects;
create policy "ads images: read" on storage.objects
  for select using (bucket_id = 'ads');
drop policy if exists "ads images: admin upload" on storage.objects;
create policy "ads images: admin upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'ads' and public.is_admin());
drop policy if exists "ads images: admin delete" on storage.objects;
create policy "ads images: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'ads' and public.is_admin());

-- ---------- 13. Explicit table grants ----------------------------------------
-- Row Level Security still decides which rows each person may touch.
-- UPDATE is NOT granted at table level here on purpose: updates are limited to
-- the columns granted above, so nobody can change owner_id, role, sender_id, etc.
grant usage on schema public to anon, authenticated;

grant select on public.listings, public.reviews, public.ads, public.site_settings to anon;

grant select on public.profiles to authenticated;
grant select, insert, delete on public.listings, public.reviews, public.blocks,
  public.favorites, public.ads, public.site_settings to authenticated;
grant select, insert on public.conversations, public.messages, public.reports to authenticated;

-- Admin-only tables (policies above allow only admins to write)
grant update on public.ads, public.site_settings to authenticated;

