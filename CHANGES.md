# VOOSITA: merged project

Built from voosita-features.zip and voosita-fix.zip. Structure and features kept.

## Added (were missing from both archives)
- lib/i18n.ts: texts for uz-Latn, uz-Cyrl, ru. Rebuilt from the keys the pages use.
  If you have the original file, compare with it and keep the original texts.
- app/layout.tsx, app/page.tsx: root layout and home route.
- app/jobs/page.tsx: jobs route (linked from the menu, was missing).
- package.json, tsconfig.json, next-env.d.ts, .gitignore.

## Fixed
- AuthModal accepts the `locale` prop (build failed with a TypeScript error).
- localStorage keys unified to voosita_locale / voosita_dark (home and section pages used a hyphen, so the language and theme chosen in Settings were lost).
- "ustalар" in about page: Cyrillic letter replaced with Latin.
- Section pages: ad banner restored (the fix version had dropped it; ads are part of the model).
- Header: messages and settings icons restored (the fix version had dropped them); "Tariflar" label now comes from i18n.
- lib/server/payments.ts:
  - verifyWebhookSignature never compared the signature; now it does (HMAC-SHA256, timing-safe). Fails closed without a secret.
  - Mock provider is refused in production.
  - createPayment throws for real providers until they are integrated, instead of returning a fake checkout.
  - activateSubscription refuses mock payments in production.

## Deployment
- next.config.mjs: output set to "export". Build output goes to `out/`.
  On Cloudflare Pages: build command `npm run build`, output directory `out`.

## Auth with Supabase (new)
- lib/supabase.ts: Supabase client, configured by two public env vars.
- lib/store.ts: registerUser / loginUser / logoutUser now use Supabase Auth.
  Passwords are checked on the server. Role comes from the profiles table.
  getCurrentUser() is a local cache only.
- components/auth-modal.tsx: real sign-up and sign-in, error messages, email confirmation notice.
- components/auth-sync.tsx: keeps the cache in sync with the session on every page.
- supabase-schema.sql: profiles table, Row Level Security, auto-profile trigger, admin role.
- Admin role is set in the database (see the end of the SQL file), not in code.
- Environment variables needed in Cloudflare: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
- Next.js set to 14.2.35 (minimum supported by the Cloudflare adapter).

## Profile (new)
- supabase-profile.sql: profile fields, public-profile read policy (logged-in users only), photo storage bucket with per-user folders.
- lib/profile.ts: load and save profile, upload and remove photos.
- app/my-profile/page.tsx: profile editor (goals, name, city, phone, photos, description, skills, experience, price range, visibility).
- Settings page: "Мой профиль" link for logged-in users.

## Platform update (listings, chat, reviews, ads, admin)
Database: run supabase-platform.sql once (after supabase-schema.sql).
- SECURITY FIX: the old "revoke update (role)" in supabase-schema.sql did not block role changes.
  supabase-platform.sql replaces it with column-level grants. Phone and role are no longer readable by other users;
  public data goes through the public_profiles view.
- Listings (job, service, housing): create, edit, hide, delete, photos, favorites. Search with filters on /jobs /services /housing /search.
- Chats between users and with support (/messages, /support). Messages refresh every 4 seconds.
- Reviews and ratings (allowed after a chat), reports, user block, admin ban.
- Ads: admin uploads per page slot; visitors see "Здесь будет ваша реклама" when empty.
- About page text and contact email are editable by the admin only (/admin?tab=about).
- Admin panel: ads, About, reports, users, listings. Support chats are in /messages for admins.
- Responsive layout (phone, tablet, desktop): header wraps, chat shows one pane on phones.
- lib/store.ts now holds auth only. Old localStorage chats, ads and config are gone.
- After unzipping run: sh cleanup.sh   (removes components/section-page.tsx and app/profile/page.tsx)

## Logo (new)
- components/brand-logo.tsx: VOOSITA WORK logo. Block letters with slots and glowing green circuit traces,
  built from the VOSITA loading-screen design. Fixed seed, so it looks the same on every visit.
- Used in the home topbar (46px) and the header on every page (32px). "WORK" tag hides on phones under 520px.
- Orbitron font loaded in globals.css.
- Traces pulse slowly; motion is off for users with reduced-motion set.

## Name: VOOSITA WORK
- Site name is now "VOOSITA WORK" in the page title, description, About texts, banners, pricing, settings and support labels.
- Browser tab title: "<page> · VOOSITA WORK". New favicon: app/icon.svg (the V from the logo).
- Not renamed on purpose: domain and email (voosita.uz), storage keys (voosita_*), internal log text.
- If the About text was already saved in the admin panel, the saved text stays as it is. Edit it in /admin?tab=about.

## Known, not fixed here (need a backend)
- Pricing page says there are no paid plans, which conflicts with the planned annual subscription.
- New screens are in Russian only. Uzbek translations of them are not written yet.
- No email or push notifications. Chat updates by polling.
- Click and Payme use their own signing schemes; the HMAC check is a placeholder (see comment in payments.ts).
- lib/bot-detect.ts is not used anywhere.

## Checks done
- TypeScript check run offline. No errors in project code. Remaining messages come only from missing npm type packages in this environment.
- Not run: `npm install` and `next build` (no network here). Run them locally before deploying.
