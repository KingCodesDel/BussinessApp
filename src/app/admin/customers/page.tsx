import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/business";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "usd" }).format(cents / 100);
}

export default async function AdminCustomersPage() {
  const { business } = await requireBusiness();
  const supabase = createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("customer_id, total_cents, created_at, profiles(full_name)")
    .eq("business_id", business.id);

  const byCustomer = new Map<
    string,
    { name: string; orders: number; spent: number; lastOrder: string }
  >();

  for (const o of orders ?? []) {
    const existing = byCustomer.get(o.customer_id);
    const name = (o.profiles as unknown as { full_name: string | null })?.full_name ?? "Customer";
    if (existing) {
      existing.orders += 1;
      existing.spent += o.total_cents;
      if (o.created_at > existing.lastOrder) existing.lastOrder = o.created_at;
    } else {
      byCustomer.set(o.customer_id, { name, orders: 1, spent: o.total_cents, lastOrder: o.created_at });
    }
  }

  const customers = Array.from(byCustomer.values()).sort((a, b) => b.spent - a.spent);

  return (
    <div>
      <h1 className="font-display text-3xl">Customers</h1>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line dark:border-line-dark text-left text-xs text-slate">
            <tr>
              <th className="px-5 py-3 font-normal">Customer</th>
              <th className="px-5 py-3 font-normal">Orders</th>
              <th className="px-5 py-3 font-normal">Total spent</th>
              <th className="px-5 py-3 font-normal">Last order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line dark:divide-line-dark">
            {customers.length > 0 ? (
              customers.map((c, i) => (
                <tr key={i}>
                  <td className="px-5 py-3">{c.name}</td>
                  <td className="px-5 py-3">{c.orders}</td>
                  <td className="price px-5 py-3">{formatPrice(c.spent)}</td>
                  <td className="px-5 py-3 text-slate">{new Date(c.lastOrder).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-slate">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
