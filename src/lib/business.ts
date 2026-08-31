import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Business } from "@/types/database";

export async function requireBusiness(): Promise<{ business: Business; role: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: owned } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user!.id)
    .maybeSingle();

  if (owned) return { business: owned as Business, role: "owner" };

  const { data: membership } = await supabase
    .from("business_members")
    .select("role, businesses(*)")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (membership?.businesses) {
    return { business: membership.businesses as unknown as Business, role: membership.role };
  }

  redirect("/business/signup");
}
