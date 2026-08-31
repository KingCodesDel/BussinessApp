import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/database";

export default async function WishlistPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/wishlist");

  const { data: items } = await supabase
    .from("wishlist_items")
    .select("product:products(*, product_images(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const products = (items ?? []).map((i) => i.product).filter(Boolean) as unknown as Product[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">Your wishlist</h1>
      {products.length === 0 ? (
        <div className="card mt-8 px-6 py-16 text-center">
          <p className="font-display text-lg">Nothing saved yet</p>
          <Link href="/shop" className="btn-primary mt-4 inline-flex">
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
