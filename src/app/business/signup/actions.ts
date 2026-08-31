"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createBusiness(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/business/signup");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return;

  const slug = `${slugify(name)}-${user!.id.slice(0, 4)}`;

  const { data: business, error } = await supabase
    .from("businesses")
    .insert({ owner_id: user!.id, name, description, slug })
    .select()
    .single();

  if (error || !business) {
    redirect("/business/signup?error=1");
  }

  await supabase.from("profiles").update({ default_role: "owner" }).eq("id", user!.id);

  redirect("/admin");
}
