import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/business";
import OrderStatusSelect from "./OrderStatusSelect";
import type { OrderStatus, OrderItem } from "@/types/database";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "usd" }).format(cents / 100);
}

interface AdminOrderRow {
  id: string;
  total_cents: number;
  status: string;
  profiles: { full_name: string | null } | null;
  order_items: OrderItem[];
}

export default async function AdminOrdersPage() {
  const { business } = await requireBusiness();
  const supabase = createClient();

  const { data: ordersRaw } = await supabase
    .from("orders")
    .select("*, profiles(full_name), order_items(*)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const orders = (ordersRaw ?? []) as unknown as AdminOrderRow[];

  return (
    <div>
      <h1 className="font-display text-3xl">Orders</h1>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line dark:border-line-dark text-left text-xs text-slate">
            <tr>
              <th className="px-5 py-3 font-normal">Order</th>
              <th className="px-5 py-3 font-normal">Customer</th>
              <th className="px-5 py-3 font-normal">Items</th>
              <th className="px-5 py-3 font-normal">Total</th>
              <th className="px-5 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line dark:divide-line-dark">
            {orders && orders.length > 0 ? (
              orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td className="px-5 py-3">{o.profiles?.full_name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate">{o.order_items?.length ?? 0}</td>
                  <td className="price px-5 py-3">{formatPrice(o.total_cents)}</td>
                  <td className="px-5 py-3">
                    <OrderStatusSelect orderId={o.id} status={o.status as OrderStatus} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
