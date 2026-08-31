"use client";

import { X } from "lucide-react";
import { deleteProductImage } from "../actions";

export default function DeleteImageButton({ imageId, productId }: { imageId: string; productId: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("Remove this image?")) deleteProductImage(imageId, productId);
      }}
      className="absolute -right-2 -top-2 rounded-full bg-ink text-porcelain p-1 shadow-soft hover:bg-red-600"
      aria-label="Remove image"
    >
      <X className="h-3 w-3" />
    </button>
  );
}
