-- VOOSITA Supabase Schema
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  country_code text default 'UZ' check (country_code in ('UZ', 'RU')),
  city text,
  preferred_locale text default 'uz-Latn' check (preferred_locale in ('uz-Latn', 'uz-Cyrl', 'ru')),
  avatar_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'active', 'expired', 'cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  provider text,
  provider_payment_id text,
  created_at timestamptz default now()
);

-- Payments
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_minor bigint not null,
  currency text default 'UZS',
  status text not null,
  provider_payment_id text,
  created_at timestamptz default now()
);

-- Listings
create table public.listings (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('specialist', 'customer_order', 'rental_offer', 'rental_request')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived', 'rejected')),
  city text,
  title text not null,
  description text,
  price_minor bigint,
  attributes jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Listing photos
create table public.listing_photos (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  path text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Conversations
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete set null,
  created_at timestamptz default now()
);

create table public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

-- Messages
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- Reviews
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (listing_id, reviewer_id)
);

-- RLS
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- Profiles: own only
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Listings: public read published, write own
create policy "listings_select_published" on public.listings for select using (status = 'published' or owner_id = auth.uid());
create policy "listings_insert_own" on public.listings for insert with check (owner_id = auth.uid());
create policy "listings_update_own" on public.listings for update using (owner_id = auth.uid());
create policy "listings_delete_own" on public.listings for delete using (owner_id = auth.uid());

-- Photos follow listing ownership (simplified)
create policy "photos_select" on public.listing_photos for select using (true);
create policy "photos_write_own" on public.listing_photos for all using (
  exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())
);

-- Subscriptions & payments: own read only
create policy "subs_select_own" on public.subscriptions for select using (user_id = auth.uid());
create policy "payments_select_own" on public.payments for select using (user_id = auth.uid());

-- Messages: participants only
create policy "messages_select_participant" on public.messages for select using (
  exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
  )
);
create policy "messages_insert_participant" on public.messages for insert with check (
  sender_id = auth.uid() and exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
  )
);

-- Reviews: public read, own write
create policy "reviews_select" on public.reviews for select using (true);
create policy "reviews_insert_own" on public.reviews for insert with check (reviewer_id = auth.uid());

-- Extended reviews (already had basic, add response & verified)
alter table public.reviews
  add column if not exists response text,
  add column if not exists is_verified boolean default false;

-- Portfolio items for specialists
create table if not exists public.portfolio_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  image_path text,
  result_text text, -- e.g. "Konversiya +34%"
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.portfolio_items enable row level security;
create policy "portfolio_select" on public.portfolio_items for select using (true);
create policy "portfolio_write_own" on public.portfolio_items for all using (user_id = auth.uid());

-- Favorites
create table if not exists public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);

alter table public.favorites enable row level security;
create policy "favorites_own" on public.favorites for all using (user_id = auth.uid());

-- Bot fingerprints log (server-side)
create table if not exists public.bot_checks (
  id uuid primary key default uuid_generate_v4(),
  fingerprint_hash text,
  score int,
  signals jsonb,
  ip_hash text,
  created_at timestamptz default now()
);
