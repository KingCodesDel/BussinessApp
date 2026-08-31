import { DollarSign, ShoppingCart, Users, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/business";
import RevenueChart from "@/components/admin/RevenueChart";
import StatCard from "@/components/admin/StatCard";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "usd" }).format(cents / 100);
}

export default async function AdminOverviewPage() {
  const { business } = await requireBusiness();
  const supabase = createClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("business_id", business.id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id);

  const { count: customerCount } = await supabase
    .from("orders")
    .select("customer_id", { count: "exact", head: true })
    .eq("business_id", business.id);

  const revenue = (orders ?? [])
    .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((s, o) => s + o.total_cents, 0);

  // bucket revenue by day for the chart
  const byDay = new Map<string, number>();
  for (const o of orders ?? []) {
    const day = new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    byDay.set(day, (byDay.get(day) ?? 0) + o.total_cents / 100);
  }
  const chartData = Array.from(byDay.entries()).map(([date, revenue]) => ({ date, revenue }));

  const { data: recentOrdersRaw } = await supabase
    .from("orders")
    .select("*, profiles(full_name)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const recentOrders = (recentOrdersRaw ?? []) as unknown as {
    id: string;
    total_cents: number;
    created_at: string;
    profiles: { full_name: string | null } | null;
  }[];

  return (
    <div>
      <h1 className="font-display text-3xl">Overview</h1>
      <p className="mt-1 text-sm text-slate">Last 30 days for {business.name}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatPrice(revenue)} icon={DollarSign} />
        <StatCard label="Orders" value={String(orders?.length ?? 0)} icon={ShoppingCart} />
        <StatCard label="Customers" value={String(customerCount ?? 0)} icon={Users} />
        <StatCard label="Products" value={String(productCount ?? 0)} icon={Package} />
      </div>

      <div className="card mt-6 p-5">
        <p className="label-eyebrow mb-4">Revenue trend</p>
        {chartData.length > 0 ? (
          <RevenueChart data={chartData} />
        ) : (
          <p className="py-16 text-center text-sm text-slate">No orders yet in this window.</p>
        )}
      </div>

      <div className="card mt-6 p-5">
        <p className="label-eyebrow mb-4">Recent activity</p>
        {recentOrders && recentOrders.length > 0 ? (
          <ul className="divide-y divide-line dark:divide-line-dark">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p>{o.profiles?.full_name ?? "A customer"} placed an order</p>
                  <p className="text-xs text-slate">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <span className="price">{formatPrice(o.total_cents)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate">No activity yet. Once you list products, orders will show up here.</p>
        )}
      </div>
    </div>
  );
}
