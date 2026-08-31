"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Product } from "@/types/database";

interface ShippingAddress {
  name: string;
  line1: string;
  city: string;
  postal_code: string;
  country: string;
}

interface CheckoutCartItem {
  id: string;
  quantity: number;
  product: Product;
}

// NOTE ON PAYMENTS
// This action creates orders in `pending` status and does not move money.
// To go live with real payments, swap the block marked STRIPE HOOK below for
// a call to `stripe.checkout.sessions.create(...)` and redirect the buyer to
// the returned session URL, then mark the order `paid` from a Stripe webhook
// (see README "Payments" section).
export async function placeOrder(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout");

  const shipping: ShippingAddress = {
    name: String(formData.get("name") ?? ""),
    line1: String(formData.get("line1") ?? ""),
    city: String(formData.get("city") ?? ""),
    postal_code: String(formData.get("postal_code") ?? ""),
    country: String(formData.get("country") ?? ""),
  };
  const promoCode = String(formData.get("promo_code") ?? "").trim().toUpperCase();

  const { data: cartItemsRaw } = await supabase
    .from("cart_items")
    .select("*, product:products(*)")
    .eq("user_id", user!.id);

  const cartItems = cartItemsRaw as unknown as CheckoutCartItem[] | null;

  if (!cartItems || cartItems.length === 0) redirect("/cart");

  // group by business — each business becomes its own order
  const byBusiness = new Map<string, typeof cartItems>();
  for (const item of cartItems) {
    const bid = item.product.business_id;
    if (!byBusiness.has(bid)) byBusiness.set(bid, []);
    byBusiness.get(bid)!.push(item);
  }

  const createdOrderIds: string[] = [];
  const failedBusinessIds: string[] = [];

  for (const [businessId, items] of byBusiness) {
    const subtotal = items.reduce((s, i) => s + i.product.price_cents * i.quantity, 0);

    let discount = 0;
    let promoId: string | null = null;
    let promoRedemptions = 0;
    if (promoCode) {
      const { data: promo } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("business_id", businessId)
        .eq("code", promoCode)
        .eq("is_active", true)
        .maybeSingle();
      const notExpired = !promo?.expires_at || new Date(promo.expires_at) > new Date();
      const underLimit = !promo?.max_redemptions || promo.redemptions < promo.max_redemptions;
      if (promo && notExpired && underLimit) {
        promoId = promo.id;
        promoRedemptions = promo.redemptions;
        discount = promo.percent_off
          ? Math.round((subtotal * promo.percent_off) / 100)
          : promo.amount_off_cents ?? 0;
      }
    }

    const shippingCents = subtotal > 10000 ? 0 : 599;
    const total = Math.max(0, subtotal - discount) + shippingCents;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        business_id: businessId,
        customer_id: user!.id,
        subtotal_cents: subtotal,
        discount_cents: discount,
        shipping_cents: shippingCents,
        total_cents: total,
        promo_code_id: promoId,
        shipping_address: shipping,
        payment_provider: "manual",
        status: "pending",
      })
      .select()
      .single();

    if (error || !order) {
      console.error(`Failed to create order for business ${businessId}:`, error?.message);
      failedBusinessIds.push(businessId);
      continue;
    }

    // STRIPE HOOK — create a Checkout Session here instead, using `order.id`
    // as client_reference_id, then redirect(session.url) and return early.

    await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        title_snapshot: i.product.title,
        unit_price_cents: i.product.price_cents,
        quantity: i.quantity,
      }))
    );

    for (const i of items) {
      await supabase
        .from("products")
        .update({ stock_quantity: Math.max(0, i.product.stock_quantity - i.quantity) })
        .eq("id", i.product.id);
    }

    if (promoId) {
      await supabase.from("promo_codes").update({ redemptions: promoRedemptions + 1 }).eq("id", promoId);
    }

    createdOrderIds.push(order.id);
  }

  // Only remove cart items whose business's order actually succeeded — if a
  // business's order failed, leave those items in the cart so the customer
  // doesn't lose them and can retry, instead of silently emptying everything.
  const succeededItemIds = cartItems
    .filter((i) => !failedBusinessIds.includes(i.product.business_id))
    .map((i) => i.id);
  if (succeededItemIds.length > 0) {
    await supabase.from("cart_items").delete().in("id", succeededItemIds);
  }

  if (createdOrderIds.length === 0) {
    throw new Error(
      "We couldn't place your order — nothing was charged and your cart has been kept. Please try again."
    );
  }

  redirect(createdOrderIds.length === 1 ? `/orders/${createdOrderIds[0]}` : "/orders");
}
