// scripts/create-admin.mjs
//
// Usage:
//   node scripts/create-admin.mjs owner@example.com "Password123!" "My Business Name"
//
// Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your env
// (source your .env.local first: `export $(grep -v '^#' .env.local | xargs)`).
//
// This creates a confirmed auth user (or reuses one if the email exists),
// sets their profile role to "owner", and creates a business row for them.

import { createClient } from "@supabase/supabase-js";

const [, , email, password, businessName] = process.argv;

if (!email || !password || !businessName) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> "<business name>"');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function slugify(input) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Store Owner" },
  });

  let userId = created?.user?.id;

  if (createError) {
    if (createError.message.includes("already been registered")) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list.users.find((u) => u.email === email);
      if (!existing) throw createError;
      userId = existing.id;
      console.log(`User ${email} already exists — reusing it.`);
    } else {
      throw createError;
    }
  }

  await supabase.from("profiles").update({ default_role: "owner" }).eq("id", userId);

  const slug = `${slugify(businessName)}-${userId.slice(0, 4)}`;
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .insert({ owner_id: userId, name: businessName, slug })
    .select()
    .single();

  if (bizError) throw bizError;

  console.log("\n✅ Admin account ready.");
  console.log(`   Email:    ${email}`);
  console.log(`   Business: ${business.name} (${business.slug})`);
  console.log(`   Log in at /login, then visit /admin.\n`);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
