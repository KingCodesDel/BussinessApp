"use server";

import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/business";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/types/database";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { business } = await requireBusiness();
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("orders")
    .select("status, customer_id, total_cents")
    .eq("id", orderId)
    .eq("business_id", business.id)
    .single();

  await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("business_id", business.id);

  // Award loyalty points only the first time an order transitions into
  // "delivered" — without the status check below, toggling delivered ->
  // something else -> delivered again would double-pay the customer.
  if (status === "delivered" && existing && existing.status !== "delivered") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("loyalty_points")
      .eq("id", existing.customer_id)
      .single();
    const earned = Math.floor(existing.total_cents / 100);
    await supabase
      .from("profiles")
      .update({ loyalty_points: (profile?.loyalty_points ?? 0) + earned })
      .eq("id", existing.customer_id);
  }

  revalidatePath("/admin/orders");
}
