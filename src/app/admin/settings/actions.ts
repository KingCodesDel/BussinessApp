"use server";

import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/business";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateBusinessProfile(formData: FormData) {
  const { business } = await requireBusiness();
  const supabase = createClient();

  const { error } = await supabase
    .from("businesses")
    .update({
      name: String(formData.get("name") ?? business.name).trim() || business.name,
      description: String(formData.get("description") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      country: String(formData.get("country") ?? "").trim() || null,
      whatsapp_number: String(formData.get("whatsapp_number") ?? "").trim() || null,
    })
    .eq("id", business.id);

  revalidatePath("/admin/settings");
  revalidatePath(`/sellers/${business.slug}`);

  if (error) {
    console.error("Failed to update business profile:", error.message);
    redirect("/admin/settings?error=1");
  }
  redirect("/admin/settings?saved=1");
}
