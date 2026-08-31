"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/types/database";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const refresh = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("cart_items")
      .select("*, product:products(*, product_images(*))")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: true });
    setItems((data as unknown as CartItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem = async (productId: string, quantity = 1) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      window.location.href = "/login?next=/cart";
      return;
    }
    const existing = items.find((i) => i.product_id === productId);
    if (existing) {
      await updateQuantity(existing.id, existing.quantity + quantity);
      return;
    }
    await supabase
      .from("cart_items")
      .insert({ user_id: auth.user.id, product_id: productId, quantity });
    await refresh();
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(itemId);
    await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
    await refresh();
  };

  const removeItem = async (itemId: string) => {
    await supabase.from("cart_items").delete().eq("id", itemId);
    await refresh();
  };

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalCents = items.reduce(
    (sum, i) => sum + (i.product?.price_cents ?? 0) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, count, subtotalCents, loading, addItem, updateQuantity, removeItem, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
