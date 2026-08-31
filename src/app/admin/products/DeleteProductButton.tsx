"use client";

import { Trash2 } from "lucide-react";
import { deleteProduct } from "./actions";

export default function DeleteProductButton({ productId }: { productId: string }) {
  return (
    <button
      onClick={() => {
        if (confirm("Delete this product? This can't be undone.")) deleteProduct(productId);
      }}
      className="rounded-lg p-2 text-slate hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
      aria-label="Delete product"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
