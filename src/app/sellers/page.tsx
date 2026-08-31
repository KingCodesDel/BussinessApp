import Link from "next/link";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Seal from "@/components/Seal";
import type { Business } from "@/types/database";

export const revalidate = 60;

export default async function SellersDirectoryPage() {
  const supabase = createClient();
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">Sellers</h1>
      <p className="mt-1 text-sm text-slate">Independent businesses selling on Velora.</p>

      {businesses && businesses.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(businesses as Business[]).map((b) => {
            const location = [b.city, b.country].filter(Boolean).join(", ");
            return (
              <Link key={b.id} href={`/sellers/${b.slug}`} className="card flex items-start gap-3 p-5 hover:border-evergreen transition">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-evergreen-50 dark:bg-evergreen-700/20">
                  <Seal className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-[15px]">{b.name}</p>
                  {location && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate">
                      <MapPin className="h-3 w-3" />
                      {location}
                    </p>
                  )}
                  {b.description && <p className="mt-1.5 line-clamp-2 text-xs text-slate">{b.description}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card mt-8 px-6 py-16 text-center text-slate">No sellers yet — be the first.</div>
      )}
    </div>
  );
}
