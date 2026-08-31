-- ============================================================================
-- VELORA — Core database schema
-- Run this once in the Supabase SQL editor (or `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type app_role as enum ('customer', 'owner', 'manager', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum
    ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type plan_tier as enum ('free', 'growth', 'scale');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- PROFILES  (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  default_role app_role not null default 'customer',
  loyalty_points integer not null default 0,
  referral_code text unique default substr(md5(gen_random_uuid()::text), 1, 8),
  referred_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- BUSINESSES (multi-tenant: each business = one storefront)
-- ----------------------------------------------------------------------------
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  cover_url text,
  address text,
  city text,
  country text,
  whatsapp_number text, -- E.164 format, e.g. +15551234567. Used to build wa.me links.
  plan plan_tier not null default 'free',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- staff/roles per business (owner is implicit via businesses.owner_id)
create table if not exists business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role app_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

-- ----------------------------------------------------------------------------
-- CATALOG
-- ----------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  unique (business_id, slug)
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  slug text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  compare_at_cents integer,
  currency text not null default 'usd',
  stock_quantity integer not null default 0,
  is_active boolean not null default true,
  video_url text,
  avg_rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, slug)
);
create index if not exists idx_products_business on products(business_id);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_title_trgm on products using gin (to_tsvector('english', title || ' ' || coalesce(description,'')));

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);

-- ----------------------------------------------------------------------------
-- CART / ORDERS
-- ----------------------------------------------------------------------------
create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  code text not null,
  percent_off integer check (percent_off between 1 and 100),
  amount_off_cents integer,
  max_redemptions integer,
  redemptions integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  unique (business_id, code)
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid not null references profiles(id) on delete cascade,
  status order_status not null default 'pending',
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  shipping_cents integer not null default 0,
  total_cents integer not null default 0,
  promo_code_id uuid references promo_codes(id),
  shipping_address jsonb,
  payment_provider text default 'manual',
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_business on orders(business_id);
create index if not exists idx_orders_customer on orders(customer_id);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  title_snapshot text not null,
  unit_price_cents integer not null,
  quantity integer not null check (quantity > 0)
);

-- ----------------------------------------------------------------------------
-- ENGAGEMENT: reviews, wishlists, referrals, notifications, messages
-- ----------------------------------------------------------------------------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  customer_id uuid not null references profiles(id) on delete cascade,
  order_id uuid references orders(id),
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  unique (product_id, customer_id, order_id)
);

create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles(id) on delete cascade,
  referred_id uuid not null references profiles(id) on delete cascade,
  reward_points integer not null default 100,
  created_at timestamptz not null default now(),
  unique (referred_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid not null references profiles(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_thread on messages(business_id, customer_id, created_at);

-- ----------------------------------------------------------------------------
-- HELPER FUNCTIONS (used inside RLS policies)
-- ----------------------------------------------------------------------------
create or replace function is_business_staff(target_business uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from businesses b where b.id = target_business and b.owner_id = auth.uid()
    union
    select 1 from business_members m where m.business_id = target_business and m.user_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;
alter table businesses enable row level security;
alter table business_members enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table cart_items enable row level security;
alter table promo_codes enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;
alter table wishlist_items enable row level security;
alter table referrals enable row level security;
alter table notifications enable row level security;
alter table messages enable row level security;

-- profiles: users manage their own row; anyone can read basic public fields
create policy "profiles_select_own_or_public" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- businesses: public read of active businesses; owner manages theirs
create policy "businesses_public_read" on businesses for select using (is_active = true or owner_id = auth.uid() or is_business_staff(id));
create policy "businesses_owner_insert" on businesses for insert with check (owner_id = auth.uid());
create policy "businesses_owner_update" on businesses for update using (owner_id = auth.uid() or is_business_staff(id));
create policy "businesses_owner_delete" on businesses for delete using (owner_id = auth.uid());

-- business_members: staff of a business (or the owner) can view; only owner manages
create policy "members_read" on business_members for select using (is_business_staff(business_id));
create policy "members_owner_write" on business_members for insert with check (
  exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
);
create policy "members_owner_delete" on business_members for delete using (
  exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid())
);

-- categories / products: public read if active; staff full manage
create policy "categories_public_read" on categories for select using (true);
create policy "categories_staff_write" on categories for insert with check (is_business_staff(business_id));
create policy "categories_staff_update" on categories for update using (is_business_staff(business_id));
create policy "categories_staff_delete" on categories for delete using (is_business_staff(business_id));

create policy "products_public_read" on products for select using (is_active = true or is_business_staff(business_id));
create policy "products_staff_write" on products for insert with check (is_business_staff(business_id));
create policy "products_staff_update" on products for update using (is_business_staff(business_id));
create policy "products_staff_delete" on products for delete using (is_business_staff(business_id));

create policy "images_public_read" on product_images for select using (true);
create policy "images_staff_write" on product_images for insert with check (
  is_business_staff((select business_id from products p where p.id = product_id))
);
create policy "images_staff_delete" on product_images for delete using (
  is_business_staff((select business_id from products p where p.id = product_id))
);

-- cart: strictly private to the owning user
create policy "cart_owner_all" on cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- promo codes: public read of active codes (needed to validate at checkout); staff manage
create policy "promo_public_read" on promo_codes for select using (is_active = true or is_business_staff(business_id));
create policy "promo_staff_write" on promo_codes for insert with check (is_business_staff(business_id));
create policy "promo_staff_update" on promo_codes for update using (is_business_staff(business_id));

-- orders: customer sees own orders; business staff see orders for their business
create policy "orders_customer_read" on orders for select using (auth.uid() = customer_id or is_business_staff(business_id));
create policy "orders_customer_insert" on orders for insert with check (auth.uid() = customer_id);
create policy "orders_staff_update" on orders for update using (is_business_staff(business_id) or auth.uid() = customer_id);

create policy "order_items_read" on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_business_staff(o.business_id)))
);
create policy "order_items_insert" on order_items for insert with check (
  exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
);

-- reviews: public read; customer writes their own; staff can moderate (delete)
create policy "reviews_public_read" on reviews for select using (true);
create policy "reviews_customer_insert" on reviews for insert with check (auth.uid() = customer_id);
create policy "reviews_customer_update" on reviews for update using (auth.uid() = customer_id);
create policy "reviews_staff_delete" on reviews for delete using (
  is_business_staff((select business_id from products p where p.id = product_id)) or auth.uid() = customer_id
);

-- wishlist: private to user
create policy "wishlist_owner_all" on wishlist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- referrals: participants can read; system inserts via server role
create policy "referrals_read" on referrals for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- notifications: private to user
create policy "notifications_owner_read" on notifications for select using (auth.uid() = user_id);
create policy "notifications_owner_update" on notifications for update using (auth.uid() = user_id);

-- messages: only the customer in the thread or staff of that business
create policy "messages_thread_read" on messages for select using (
  auth.uid() = customer_id or is_business_staff(business_id)
);
create policy "messages_thread_insert" on messages for insert with check (
  auth.uid() = sender_id and (auth.uid() = customer_id or is_business_staff(business_id))
);

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------
-- auto-create a profile row whenever a new auth user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- keep products.avg_rating / review_count in sync
create or replace function refresh_product_rating()
returns trigger language plpgsql security definer as $$
declare
  target_product uuid := coalesce(new.product_id, old.product_id);
begin
  update products p set
    avg_rating = coalesce((select round(avg(rating)::numeric, 1) from reviews where product_id = target_product), 0),
    review_count = (select count(*) from reviews where product_id = target_product)
  where p.id = target_product;
  return null;
end;
$$;

drop trigger if exists on_review_change on reviews;
create trigger on_review_change
  after insert or update or delete on reviews
  for each row execute procedure refresh_product_rating();

-- ============================================================================
-- STORAGE POLICIES — product-images bucket
-- ============================================================================
-- Supabase Storage has RLS enabled by default with ZERO policies, meaning all
-- uploads/deletes are denied until policies exist here, even after creating
-- the "product-images" bucket in the dashboard. Marking a bucket "Public"
-- only affects reads (it serves files via a public URL, bypassing RLS for
-- SELECT) — it does NOT grant upload permission. Run this after creating the
-- bucket, or uploads from /admin/products/new will fail silently.
--
-- These assume the upload path convention used by the app:
-- `${business_id}/${product_id}/${filename}` — the first path segment must
-- match a business the uploading user owns or staffs.

create policy "product_images_public_read"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "product_images_business_upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (
    select id::text from businesses where owner_id = auth.uid()
    union
    select business_id::text from business_members where user_id = auth.uid()
  )
);

create policy "product_images_business_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] in (
    select id::text from businesses where owner_id = auth.uid()
    union
    select business_id::text from business_members where user_id = auth.uid()
  )
);

-- ============================================================================
-- SEED DATA (demo business + products) — safe to skip in production
-- ============================================================================
-- Run scripts/create-admin.mjs first to create an owner user, then insert a
-- business row for that user's id and re-run the product inserts below.
