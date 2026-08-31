"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendMessage(params: {
  businessId: string;
  customerId: string;
  body: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !params.body.trim()) return;

  await supabase.from("messages").insert({
    business_id: params.businessId,
    customer_id: params.customerId,
    sender_id: user.id,
    body: params.body.trim(),
  });

  revalidatePath("/admin/messages");
}
