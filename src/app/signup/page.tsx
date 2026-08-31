"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Seal from "@/components/Seal";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const referralCode = params.get("ref");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // attribute referral, if any (profile row is created by the DB trigger)
    if (referralCode && data.user) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle();
      if (referrer) {
        await supabase.from("profiles").update({ referred_by: referrer.id }).eq("id", data.user.id);
        await supabase.from("referrals").insert({ referrer_id: referrer.id, referred_id: data.user.id });
      }
    }

    setLoading(false);
    if (data.session) {
      router.push(params.get("next") ?? "/");
      router.refresh();
    } else {
      setDone(true); // email confirmation required
    }
  };

  if (done) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col items-center justify-center px-4 text-center">
        <Seal className="h-10 w-10" />
        <h1 className="mt-4 font-display text-2xl">Check your inbox</h1>
        <p className="mt-2 text-sm text-slate">
          We sent a confirmation link to {email}. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-8 flex flex-col items-center">
        <Seal className="h-10 w-10" />
        <h1 className="mt-4 font-display text-2xl">Create your account</h1>
        {referralCode && <p className="mt-1 text-sm text-evergreen">Referral code {referralCode} applied</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-eyebrow mb-1.5 block">Full name</label>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        Already have an account?{" "}
        <Link href="/login" className="text-evergreen hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
