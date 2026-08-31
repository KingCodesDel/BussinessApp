import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBusiness } from "./actions";
import Seal from "@/components/Seal";

export default async function BusinessSignupPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/business/login?next=/business/signup");

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <Seal className="h-10 w-10" />
        <h1 className="mt-4 font-display text-2xl">Register your business</h1>
        <p className="mt-1 text-sm text-slate">
          You&apos;ll get your own storefront and an owner dashboard — free to start.
        </p>
      </div>

      <form action={createBusiness} className="space-y-4">
        <div>
          <label className="label-eyebrow mb-1.5 block">Business name</label>
          <input name="name" required className="input" placeholder="Maple & Co." />
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Short description</label>
          <textarea name="description" rows={3} className="input" placeholder="What do you sell?" />
        </div>
        <button type="submit" className="btn-primary w-full">
          Create business
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        Already registered a business?{" "}
        <Link href="/business/login" className="text-evergreen hover:underline">
          Log in to your dashboard
        </Link>
      </p>
    </div>
  );
}
