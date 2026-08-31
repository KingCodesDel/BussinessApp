import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { placeOrder } from "./actions";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "usd" }).format(cents / 100);
}

export default async function CheckoutPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout");

  const { data: cartItemsRaw } = await supabase
    .from("cart_items")
    .select("*, product:products(title, price_cents)")
    .eq("user_id", user.id);

  interface SummaryCartItem { id: string; quantity: number; product: { title: string; price_cents: number } }
  const cartItems = cartItemsRaw as unknown as SummaryCartItem[] | null;

  if (!cartItems || cartItems.length === 0) redirect("/cart");

  const subtotal = cartItems.reduce((s, i) => s + i.product.price_cents * i.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">Checkout</h1>

      <form action={placeOrder} className="mt-8 grid gap-8 md:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div>
            <label className="label-eyebrow mb-1.5 block">Full name</label>
            <input name="name" required className="input" placeholder="Jamie Rivera" />
          </div>
          <div>
            <label className="label-eyebrow mb-1.5 block">Address</label>
            <input name="line1" required className="input" placeholder="123 Market St" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-eyebrow mb-1.5 block">City</label>
              <input name="city" required className="input" />
            </div>
            <div>
              <label className="label-eyebrow mb-1.5 block">Postal code</label>
              <input name="postal_code" required className="input" />
            </div>
          </div>
          <div>
            <label className="label-eyebrow mb-1.5 block">Country</label>
            <input name="country" required className="input" defaultValue="United States" />
          </div>
          <div>
            <label className="label-eyebrow mb-1.5 block">Promo code (optional)</label>
            <input name="promo_code" className="input" placeholder="WELCOME10" />
          </div>
          <p className="text-xs text-slate">
            Payment is stubbed for this build (status starts as <em>pending</em>). Wire up Stripe
            Checkout in <code>src/app/checkout/actions.ts</code> — see README → Payments.
          </p>
        </div>

        <div className="card h-fit p-5">
          <p className="label-eyebrow mb-3">Order summary</p>
          <ul className="space-y-1.5 text-sm">
            {cartItems.map((i) => (
              <li key={i.id} className="flex justify-between text-slate">
                <span className="line-clamp-1 pr-2">{i.quantity}× {i.product.title}</span>
                <span className="price shrink-0">{formatPrice(i.product.price_cents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-line dark:border-line-dark pt-3 text-sm font-medium">
            <span>Subtotal</span>
            <span className="price">{formatPrice(subtotal)}</span>
          </div>
          <button type="submit" className="btn-primary mt-4 w-full">
            Place order
          </button>
        </div>
      </form>
    </div>
  );
}
