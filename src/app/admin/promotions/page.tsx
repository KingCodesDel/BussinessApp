import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/business";
import { createPromoCode } from "./actions";
import PromoToggle from "./PromoToggle";

const errorMessages: Record<string, string> = {
  missing_fields: "Enter a code and either a percent-off or dollar-off amount.",
  duplicate_code: "You already have a promo code with that name — try a different one.",
  "1": "Something went wrong creating that code — please try again.",
};

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: { created?: string; error?: string };
}) {
  const { business } = await requireBusiness();
  const supabase = createClient();

  const { data: promos } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("business_id", business.id)
    .order("id", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl">Promotions</h1>

      {searchParams.created && (
        <p className="mt-4 rounded-xl bg-evergreen-50 px-4 py-2.5 text-sm text-evergreen dark:bg-evergreen-700/20">
          Promo code created.
        </p>
      )}
      {searchParams.error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-950/30">
          {errorMessages[searchParams.error] ?? errorMessages["1"]}
        </p>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line dark:border-line-dark text-left text-xs text-slate">
              <tr>
                <th className="px-5 py-3 font-normal">Code</th>
                <th className="px-5 py-3 font-normal">Discount</th>
                <th className="px-5 py-3 font-normal">Used</th>
                <th className="px-5 py-3 font-normal">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-line-dark">
              {promos && promos.length > 0 ? (
                promos.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 font-mono">{p.code}</td>
                    <td className="px-5 py-3">
                      {p.percent_off ? `${p.percent_off}% off` : `$${((p.amount_off_cents ?? 0) / 100).toFixed(2)} off`}
                    </td>
                    <td className="px-5 py-3 text-slate">{p.redemptions}{p.max_redemptions ? ` / ${p.max_redemptions}` : ""}</td>
                    <td className="px-5 py-3">
                      <PromoToggle promoId={p.id} isActive={p.is_active} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate">
                    No promo codes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card h-fit p-5">
          <p className="label-eyebrow mb-4">New promo code</p>
          <form action={createPromoCode} className="space-y-3">
            <input name="code" required placeholder="WELCOME10" className="input" />
            <input name="percent_off" type="number" min="1" max="100" placeholder="% off (e.g. 10)" className="input" />
            <p className="text-center text-xs text-slate">— or —</p>
            <input name="amount_off" type="number" step="0.01" min="0" placeholder="$ off (e.g. 5.00)" className="input" />
            <div>
              <label className="label-eyebrow mb-1.5 block">Expires (optional)</label>
              <input name="expires_at" type="date" className="input" />
            </div>
            <button type="submit" className="btn-primary w-full">
              Create code
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
