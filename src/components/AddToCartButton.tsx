"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

export default function AddToCartButton({ productId, inStock }: { productId: string; inStock: boolean }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    await addItem(productId, qty);
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-xl border border-line dark:border-line-dark">
        <button
          className="px-3 py-2 text-lg disabled:opacity-40"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          aria-label="Decrease quantity"
        >
          –
        </button>
        <span className="w-8 text-center font-mono text-sm">{qty}</span>
        <button
          className="px-3 py-2 text-lg"
          onClick={() => setQty((q) => q + 1)}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button onClick={handleAdd} disabled={!inStock || adding} className="btn-primary flex-1">
        {!inStock ? "Out of stock" : added ? "Added ✓" : adding ? "Adding…" : "Add to cart"}
      </button>
    </div>
  );
}
