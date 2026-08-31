"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "usd" }).format(cents / 100);
}

export default function CartPage() {
  const { items, subtotalCents, updateQuantity, removeItem, loading } = useCart();

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate">Loading cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-2xl">Your cart is empty</p>
        <p className="mt-2 text-sm text-slate">Add something you&apos;ll love.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">Your cart</h1>

      <div className="mt-8 divide-y divide-line dark:divide-line-dark">
        {items.map((item) => {
          const image = item.product?.product_images?.[0]?.url;
          return (
            <div key={item.id} className="flex flex-wrap items-center gap-4 py-5 sm:flex-nowrap">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-line/40 dark:bg-line-dark/40">
                {image && <Image src={image} alt={item.product?.title ?? ""} fill className="object-cover" />}
              </div>
              <div className="min-w-[140px] flex-1">
                <Link href={`/products/${item.product?.slug}`} className="font-medium hover:text-evergreen">
                  {item.product?.title}
                </Link>
                <p className="price mt-1 text-sm text-slate">
                  {formatPrice(item.product?.price_cents ?? 0)}
                </p>
              </div>
              <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-4">
                <div className="flex items-center rounded-xl border border-line dark:border-line-dark">
                  <button
                    className="px-3 py-1.5"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    –
                  </button>
                  <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                  <button
                    className="px-3 py-1.5"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <p className="price w-16 shrink-0 text-right text-sm sm:w-20">
                  {formatPrice((item.product?.price_cents ?? 0) * item.quantity)}
                </p>
                <button
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 p-2 text-slate hover:text-red-600"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-end gap-2 border-t border-line dark:border-line-dark pt-6">
        <div className="flex w-full max-w-xs justify-between text-sm text-slate">
          <span>Subtotal</span>
          <span className="price">{formatPrice(subtotalCents)}</span>
        </div>
        <p className="w-full max-w-xs text-right text-xs text-slate">Shipping and tax calculated at checkout.</p>
        <Link href="/checkout" className="btn-primary mt-2 w-full max-w-xs">
          Checkout
        </Link>
      </div>
    </div>
  );
}
