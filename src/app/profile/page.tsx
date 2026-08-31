import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/signup?ref=${profile?.referral_code}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">Your profile</h1>

      <div className="card mt-8 p-6">
        <p className="label-eyebrow">Name</p>
        <p className="mt-1">{profile?.full_name ?? "—"}</p>
        <p className="label-eyebrow mt-4">Email</p>
        <p className="mt-1">{user.email}</p>
      </div>

      <div className="card mt-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="label-eyebrow">Loyalty points</p>
            <p className="font-display text-3xl text-evergreen">{profile?.loyalty_points ?? 0}</p>
          </div>
          <p className="max-w-[160px] text-right text-xs text-slate">
            Earn 1 point per $1 spent. Redeem at checkout (coming soon).
          </p>
        </div>
      </div>

      <div className="card mt-6 p-6">
        <p className="label-eyebrow">Your referral link</p>
        <p className="mt-2 break-all rounded-lg bg-black/5 dark:bg-white/5 px-3 py-2 font-mono text-xs">
          {referralLink}
        </p>
        <p className="mt-2 text-xs text-slate">
          Share this — you and your friend both earn 100 points when they sign up.
        </p>
      </div>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
