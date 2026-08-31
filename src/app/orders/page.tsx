import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrderItem } from "@/types/database";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "usd" }).format(cents / 100);
}

const statusColor: Record<string, string> = {
  pending: "bg-slate/20 text-slate",
  paid: "bg-evergreen-100 text-evergreen-700",
  processing: "bg-evergreen-100 text-evergreen-700",
  shipped: "bg-gold-light text-ink",
  delivered: "bg-evergreen text-white",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-red-100 text-red-700",
};

interface OrderListRow {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  businesses: { name: string } | null;
  order_items: OrderItem[];
}

export default async function OrdersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/orders");

  const { data: ordersRaw } = await supabase
    .from("orders")
    .select("*, businesses(name), order_items(*)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const orders = ordersRaw as unknown as OrderListRow[] | null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">Your orders</h1>

      {!orders || orders.length === 0 ? (
        <div className="card mt-8 px-6 py-16 text-center">
          <p className="font-display text-lg">No orders yet</p>
          <Link href="/shop" className="btn-primary mt-4 inline-flex">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="card flex items-center justify-between p-5 hover:border-evergreen transition"
            >
              <div>
                <p className="font-medium">{o.businesses?.name}</p>
                <p className="text-xs text-slate">
                  {new Date(o.created_at).toLocaleDateString()} · {o.order_items?.length ?? 0} item(s)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-mono capitalize ${statusColor[o.status]}`}>
                  {o.status}
                </span>
                <span className="price text-sm">{formatPrice(o.total_cents)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
