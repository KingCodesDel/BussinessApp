// Hand-authored types matching supabase/schema.sql.
// For full accuracy after schema changes, regenerate with:
//   npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.ts

export type AppRole = "customer" | "owner" | "manager" | "staff";
export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type PlanTier = "free" | "growth" | "scale";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  default_role: AppRole;
  loyalty_points: number;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  whatsapp_number: string | null;
  plan: PlanTier;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  currency: string;
  stock_quantity: number;
  is_active: boolean;
  video_url: string | null;
  avg_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  product_images?: { id: string; url: string; sort_order: number }[];
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  business_id: string;
  customer_id: string;
  status: OrderStatus;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  total_cents: number;
  promo_code_id: string | null;
  shipping_address: Record<string, unknown> | null;
  payment_provider: string;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  title_snapshot: string;
  unit_price_cents: number;
  quantity: number;
}

export interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  order_id: string | null;
  rating: number;
  body: string | null;
  created_at: string;
  profiles?: { full_name: string | null };
}

// Minimal `Database` shape so @supabase/ssr generics compile.
// Replace with the generated type for full column-level safety.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
