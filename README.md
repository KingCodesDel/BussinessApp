# Velora — multi-tenant e-commerce platform (starter)

A real, deployable foundation for a two-sided commerce platform: a customer storefront
and a business owner dashboard, built on Next.js 14 (App Router) + Supabase.

**Read this before assuming scope.** This is a working scaffold, not a finished
enterprise SaaS. Auth, database, RLS, cart, checkout, catalog management, order
management, reviews, wishlist, promo codes, referrals, loyalty points, and
real-time chat are implemented and functional end-to-end. AI assistant, Stripe
payments, push notifications, and multi-role staff permissions are stubbed or
partially wired — see **"What's stubbed"** at the bottom for exactly what's left
and where to plug it in.

---

## 1. Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, custom design tokens (see `tailwind.config.ts`) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (email/password, session cookies via `@supabase/ssr`) |
| Storage | Supabase Storage (product images) |
| Charts | Recharts |
| Realtime | Supabase Realtime (chat) |
| Hosting | Vercel (frontend) + Supabase (backend) — both have $0 free tiers |

---

## 2. Project structure

```
src/
  app/
    page.tsx                 customer home
    shop/                     browse + search + filter
    products/[slug]/          product detail
    cart/, checkout/          cart + order placement
    orders/, orders/[id]/     order history + tracking
    wishlist/                 saved items
    login/, signup/           customer auth
    business/login/           business owner auth (separate from customer login)
    profile/                  loyalty points, referral link
    business/signup/          register a new storefront
    support/                  customer support chat
    sellers/, sellers/[slug]/ marketplace directory + public seller storefronts
    admin/                    owner dashboard (protected)
      page.tsx                 revenue/analytics overview
      products/                 catalog CRUD + image upload
      orders/                   order + fulfillment management
      customers/                 customer list & LTV
      promotions/               coupon management
      reviews/                  review moderation
      messages/                 support inbox (realtime)
      settings/                 storefront profile: location + WhatsApp contact
  components/                shared UI (Navbar, ProductCard, ChatThread, etc)
  context/                   CartContext, ThemeContext
  lib/supabase/              browser/server Supabase clients
  middleware.ts              session refresh + /admin route guard
supabase/schema.sql          full DB schema + RLS policies + triggers
scripts/create-admin.mjs     CLI to bootstrap the first owner account
```

---

## 3. Local setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase values (step 4)
npm run dev                  # http://localhost:3000
```

## 4. Supabase setup ($0 tier)

1. Create a project at supabase.com (free tier).
2. Project Settings -> API -> copy Project URL and anon public key into
   `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   Also copy the service_role key into `SUPABASE_SERVICE_ROLE_KEY` (server-only —
   never expose this to the browser).
3. SQL Editor -> paste the full contents of `supabase/schema.sql` -> Run.
   This creates every table, enum, RLS policy, and trigger in one pass.
4. Storage -> New bucket -> name it exactly `product-images` -> make it public
   (read access). This is where the admin product form uploads images.
   **Important**: marking a bucket "public" only affects *reads*. Uploads
   still go through Row-Level Security, which is enabled by default on
   Supabase Storage with zero policies — meaning uploads are silently denied
   until you also run the storage policies included in `schema.sql` (step 3
   above already includes them for a fresh project; existing projects should
   run `supabase/migrations/003_storage_policies.sql`). If product images
   never seem to save, this is almost always why.
5. Database -> Replication -> enable replication on the `messages` table so the
   realtime chat widget receives new messages live. (Everything else works without
   this — it only affects live chat delivery; a page refresh will still show new
   messages.)
6. Authentication -> Providers -> email/password is on by default. Turn off
   "Confirm email" while developing locally so signup doesn't require inbox access,
   or leave it on and check the confirmation email flow in the Auth logs tab.

**Already had a Supabase project running before this update?** New installs get
everything from step 3 above automatically. If you set up your database before
seller location/WhatsApp fields were added, run
`supabase/migrations/002_seller_location_contact.sql` once in the SQL Editor
to add the new columns without losing existing data. If product image uploads
have never worked, also run `supabase/migrations/003_storage_policies.sql` —
it's very likely the cause (see the Storage step above).

**"Buy the developer a coffee" link**: set `NEXT_PUBLIC_COFFEE_URL` in
`.env.local` (and in Vercel's environment variables) to your own
buymeacoffee.com / ko-fi / similar link. It falls back to a generic
buymeacoffee.com URL if left unset — replace it before going live.

## 5. Create your first business owner account

```bash
export $(grep -v '^#' .env.local | xargs)
npm run seed:admin -- owner@example.com "StrongPassword123!" "My Business"
```

This creates a confirmed auth user, sets their profile role to `owner`, and
creates a business row for them. Log in at `/business/login` with those
credentials — you'll land straight on `/admin`.

Alternatively, any customer can become a business owner organically through the
UI: sign up at `/signup`, then visit `/business/signup` to register a store —
this is the real self-serve onboarding flow multi-tenant SaaS platforms use.
Once a business exists, `/business/login` is the return path for that owner
(distinct from `/login`, which is for customers) — visiting `/admin` while
signed out redirects here automatically.

## 6. Deploy ($0 monthly)

1. Push this repo to GitHub.
2. vercel.com -> New Project -> import the repo.
3. Add the same env vars from `.env.local` in Vercel's Environment Variables
   settings (all of them — including the service role key, marked as a
   server-only secret; Vercel does not expose it to the client bundle since
   it's never referenced in client components).
4. Deploy. Update `NEXT_PUBLIC_SITE_URL` to your production URL afterward (used
   for building referral links) and redeploy.

Both Vercel's Hobby tier and Supabase's Free tier support this project at zero
cost until you have meaningful production traffic.

---

## 7. Database schema

See `supabase/schema.sql` for the authoritative source. Summary:

- **profiles** — 1:1 with `auth.users`, auto-created via trigger on signup.
  Holds role, loyalty points, referral code.
- **businesses** — one row per storefront (multi-tenant root). `owner_id` -> profiles.
- **business_members** — staff assignments (`manager`/`staff` roles) per business.
- **categories**, **products**, **product_images** — catalog, scoped by `business_id`.
- **cart_items** — private per user.
- **orders**, **order_items** — one order per business per checkout (a cart
  spanning two businesses creates two orders, exactly like Amazon splits by seller).
- **promo_codes** — percent or fixed-amount discounts, scoped per business.
- **reviews** — 1-5 star + text, tied to a product and (optionally) an order.
  A trigger keeps `products.avg_rating`/`review_count` in sync automatically.
- **wishlist_items**, **referrals**, **notifications**, **messages** — engagement features.

**Row-Level Security** is enabled on every table. The core pattern: an
`is_business_staff(business_id)` SQL function checks whether `auth.uid()` is
the business owner or a `business_members` row, and every write policy for
business-owned tables calls it. Customers can only read/write their own rows
(cart, wishlist, orders, reviews, messages).

---

## 8. Payments — how to go live

Checkout currently creates orders in `pending` status without moving money
(`src/app/checkout/actions.ts`). This lets you test the full flow with $0 cost
and no Stripe account. To accept real payments:

1. `npm install stripe`
2. Add `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` (already in `.env.example`).
3. In `src/app/checkout/actions.ts`, replace the block marked `STRIPE HOOK` with
   a call to `stripe.checkout.sessions.create(...)`, passing the order's
   `total_cents` and `order.id` as `client_reference_id`, then
   `redirect(session.url)` instead of continuing to build order_items locally.
4. Add a `src/app/api/webhooks/stripe/route.ts` that verifies the Stripe
   signature and, on `checkout.session.completed`, sets the matching order's
   `status` to `paid`.

## 9. What's stubbed (be aware before calling this "done")

- **Payments**: architecturally ready (order/promo math is correct), but no
  live payment provider is wired in yet — see section 8.
- **AI business assistant**: not implemented. The natural integration point is
  a new `src/app/admin/assistant/` route that sends the business's recent
  orders/products to an LLM API and streams back analysis — no scaffolding for
  this exists yet.
- **Push notifications**: the `notifications` table and RLS exist; nothing
  currently writes to it or renders a bell dropdown. Order-status-change and
  new-message triggers are the natural place to insert rows.
- **Fine-grained staff permissions**: `business_members.role` (manager/staff)
  is stored and used by `is_business_staff()` for access, but the admin UI
  doesn't yet differentiate what a "staff" vs "manager" can click — today
  anyone in `business_members` has full admin access.
- **Subscription billing (Free/Growth/Scale plans)**: `businesses.plan` exists
  as a column with no enforcement or upgrade flow yet.
- **Multi-image drag-reorder, video upload (vs. URL), bulk CSV import**: basic
  versions exist (multi-file upload, video by URL); no drag-reorder or CSV yet.
- **Seller location/WhatsApp**: nothing is filled in automatically when a
  business signs up — owners must visit `/admin/settings` and enter their
  address/city/country/WhatsApp number themselves before those show on their
  public `/sellers/[slug]` page. No map/geocoding is wired in — location is
  plain text, not coordinates.

None of this is hidden — it's flagged here and, where relevant, with inline
`// NOTE` comments in the code at the exact spot to extend.

---

## 10. Testing this build

Manual smoke test (no test framework is wired in yet — see note below):

1. **Customer flow**: `/signup` -> browse `/shop` -> open a product -> add to
   cart -> `/checkout` -> place order -> see it under `/orders`.
2. **Reviews**: as the same user, submitting a review requires product +
   customer (add a quick review form to the product page, or insert directly
   via the Supabase table editor while testing).
3. **Wishlist**: heart icon on any product card/detail page -> check `/wishlist`.
4. **Owner flow**: `/business/signup` -> `/admin` -> add a product with images
   (`/admin/products/new`) -> confirm it appears on the public `/shop`. Log
   out and confirm `/business/login` gets you back into the same dashboard.
5. **Mobile nav**: shrink the browser below ~768px (or use a real phone) and
   open `/admin` — you should see a hamburger button, not a missing sidebar.
   Confirm every dashboard section is reachable from the slide-out menu.
6. **Order management**: place an order as a customer, then as the owner go
   to `/admin/orders` and change its status — confirm the customer's
   `/orders/[id]` tracker updates.
7. **Promo codes**: create one at `/admin/promotions`, apply it at checkout,
   confirm the discount lands on the created order.
8. **Chat**: go to any product page (or `/sellers/[slug]`) and tap "Ask the
   seller" / "Message on Velora" — this now works even without a prior order.
   Send a message; as the owner, go to `/admin/messages` and reply — confirm
   it appears without a refresh (requires the Replication step in section 4).
9. **Marketplace/seller pages**: as the owner, fill in location + WhatsApp
   number at `/admin/settings`, then check `/sellers` (your business should
   appear with its location) and `/sellers/[your-slug]` (location + WhatsApp
   button should show). Open one of your products and confirm "More from this
   seller" and the WhatsApp button appear — the WhatsApp button only renders
   if you've set a number in settings.
10. **Image uploads**: at `/admin/products/new`, create a product with at
    least one image and confirm it actually appears on the product page
    afterward (not just that the form submitted). If you see a banner about
    image upload failures, you're missing the storage policies — see section 4.
11. **Uncategorized products**: create a product *without* picking a category
    and confirm it still shows up on `/shop` (not just on the homepage).
12. **A product that fails to load should never silently 404**: if you ever
    see "product not found" for a product you know exists, check the Vercel
    function logs for the actual database error rather than assuming the
    product is gone — every page that can 404 now throws a real error instead
    of masking a query failure as "not found."

For automated coverage, the natural next step is Playwright for the flows
above — none is included in this pass to keep the initial scope shippable.

---

## 11. Security notes

- All tenant isolation is enforced at the database layer via RLS — not just in
  application code — so a bug in a page component can't leak another
  business's orders or another customer's cart.
- The service role key is only ever used server-side (`scripts/create-admin.mjs`
  and, if you add them, server actions that must bypass RLS intentionally) —
  never imported in any file under `"use client"`.
- Input on all forms should be validated with `zod` before hitting the database
  in production; the current server actions do basic type coercion but not
  full schema validation — add `zod` schemas to `checkout/actions.ts` and
  `admin/products/actions.ts` before accepting real customer data.
- File uploads go straight to a public Storage bucket with no server-side
  file-type/size validation yet — add that check in
  `admin/products/actions.ts` before the `supabase.storage` upload call if
  you'll accept uploads from untrusted users.
