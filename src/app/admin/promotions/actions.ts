"use server";

import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/business";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPromoCode(formData: FormData) {
  const { business } = await requireBusiness();
  const supabase = createClient();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const percentOff = formData.get("percent_off") ? parseInt(String(formData.get("percent_off")), 10) : null;
  const amountOff = formData.get("amount_off") ? Math.round(parseFloat(String(formData.get("amount_off"))) * 100) : null;
  const expiresAt = formData.get("expires_at") ? new Date(String(formData.get("expires_at"))).toISOString() : null;

  if (!code || (!percentOff && !amountOff)) {
    redirect("/admin/promotions?error=missing_fields");
  }

  const { error } = await supabase.from("promo_codes").insert({
    business_id: business.id,
    code,
    percent_off: percentOff,
    amount_off_cents: amountOff,
    expires_at: expiresAt,
  });

  revalidatePath("/admin/promotions");

  if (error) {
    console.error("Failed to create promo code:", error.message);
    // Most common cause: this business already has a code with this name
    // (code is unique per business) — surface that instead of doing nothing.
    redirect(
      error.code === "23505" ? "/admin/promotions?error=duplicate_code" : "/admin/promotions?error=1"
    );
  }
  redirect("/admin/promotions?created=1");
}

export async function togglePromoCode(promoId: string, isActive: boolean) {
  const { business } = await requireBusiness();
  const supabase = createClient();
  await supabase.from("promo_codes").update({ is_active: isActive }).eq("id", promoId).eq("business_id", business.id);
  revalidatePath("/admin/promotions");
}
