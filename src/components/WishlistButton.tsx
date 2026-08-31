"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function WishlistButton({ productId }: { productId: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", auth.user.id)
        .eq("product_id", productId)
        .maybeSingle();
      setSaved(!!data);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      window.location.href = "/login?next=/wishlist";
      return;
    }
    setBusy(true);
    if (saved) {
      await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", auth.user.id)
        .eq("product_id", productId);
      setSaved(false);
    } else {
      await supabase.from("wishlist_items").insert({ user_id: auth.user.id, product_id: productId });
      setSaved(true);
    }
    setBusy(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      className="rounded-full bg-surface/90 dark:bg-surface-dark/90 p-2 shadow-soft transition hover:scale-105"
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-evergreen text-evergreen" : "text-ink dark:text-porcelain"}`} />
    </button>
  );
}
