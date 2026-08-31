import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrderItem } from "@/types/database";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "usd" }).format(cents / 100);
}

const steps = ["pending", "paid", "processing", "shipped", "delivered"];

interface OrderDetailRow {
  id: string;
  status: string;
  shipping_cents: number;
  discount_cents: number;
  total_cents: number;
  shipping_address: unknown;
  businesses: { name: string } | null;
  order_items: OrderItem[];
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: orderRaw, error } = await supabase
    .from("orders")
    .select("*, businesses(name), order_items(*)")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load order:", error.message);
    throw new Error(`Could not load this order: ${error.message}`);
  }
  if (!orderRaw) notFound();
  const order = orderRaw as unknown as OrderDetailRow;

  const currentStep = steps.indexOf(order.status);
  const address = order.shipping_address as { name?: string; line1?: string; city?: string; postal_code?: string; country?: string } | null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="label-eyebrow">Order</p>
      <h1 className="font-display text-2xl">{order.id.slice(0, 8).toUpperCase()}</h1>
      <p className="mt-1 text-sm text-slate">Sold by {order.businesses?.name}</p>

      {!["cancelled", "refunded"].includes(order.status) && (
        <div className="card mt-8 p-6">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center text-center">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${i <= currentStep ? "bg-evergreen" : "bg-line dark:bg-line-dark"}`}
                />
                <span className={`mt-2 text-[11px] capitalize ${i <= currentStep ? "text-evergreen" : "text-slate"}`}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-6 divide-y divide-line dark:divide-line-dark p-5">
        {order.order_items?.map((item) => (
          <div key={item.id} className="flex justify-between py-2.5 text-sm">
            <span>{item.quantity}× {item.title_snapshot}</span>
            <span className="price">{formatPrice(item.unit_price_cents * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between py-2.5 text-sm text-slate">
          <span>Shipping</span>
          <span className="price">{formatPrice(order.shipping_cents)}</span>
        </div>
        {order.discount_cents > 0 && (
          <div className="flex justify-between py-2.5 text-sm text-evergreen">
            <span>Discount</span>
            <span className="price">−{formatPrice(order.discount_cents)}</span>
          </div>
        )}
        <div className="flex justify-between py-2.5 font-medium">
          <span>Total</span>
          <span className="price">{formatPrice(order.total_cents)}</span>
        </div>
      </div>

      {address && (
        <div className="card mt-6 p-5 text-sm text-slate">
          <p className="label-eyebrow mb-2 text-ink dark:text-porcelain">Shipping to</p>
          <p>{address.name}</p>
          <p>{address.line1}</p>
          <p>{address.city}, {address.postal_code}</p>
          <p>{address.country}</p>
        </div>
      )}
    </div>
  );
}
