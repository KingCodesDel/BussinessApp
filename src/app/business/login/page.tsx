"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function BusinessLoginPage() {
  return (
    <Suspense fallback={null}>
      <BusinessLoginForm />
    </Suspense>
  );
}

function BusinessLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // requireBusiness() on /admin will bounce a non-owner to /business/signup,
    // so it's safe to always send business-login users there.
    router.push(params.get("next") ?? "/admin");
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-evergreen-100 dark:bg-evergreen-700/20">
          <Store className="h-6 w-6 text-evergreen" />
        </div>
        <h1 className="mt-4 font-display text-2xl">Business login</h1>
        <p className="mt-1 text-sm text-slate">Log in to manage your Velora storefront</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-eyebrow mb-1.5 block">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Log in to dashboard"}
        </button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-slate">
        <p>
          New seller?{" "}
          <Link href="/signup?next=/business/signup" className="text-evergreen hover:underline">
            Create a business account
          </Link>
        </p>
        <p>
          Shopping instead?{" "}
          <Link href="/login" className="text-evergreen hover:underline">
            Customer login
          </Link>
        </p>
      </div>
    </div>
  );
}
