import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/database";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .limit(6);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line dark:border-line-dark">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
          <div className="animate-fade-up">
            <p className="label-eyebrow mb-4">Made by independent businesses</p>
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Goods worth
              <br />
              <span className="italic text-evergreen">keeping.</span>
            </h1>
            <p className="mt-5 max-w-md text-slate">
              Velora connects you directly with the makers and small businesses behind every
              product — no middlemen, no mystery supply chains.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/shop" className="btn-primary">
                Browse the shop <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/business/signup" className="btn-secondary">
                Start selling
              </Link>
            </div>
          </div>
          <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-evergreen-100 to-gold-light/40 dark:from-evergreen-700 dark:to-evergreen-600">
            <div className="absolute inset-8 rounded-2xl border border-gold/40" style={{ borderStyle: "dashed" }} />
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className="rounded-full border border-line dark:border-line-dark px-4 py-2 text-sm hover:border-evergreen hover:text-evergreen transition"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl">Newly listed</h2>
          <Link href="/shop" className="text-sm text-evergreen hover:underline">
            View all
          </Link>
        </div>
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {(products as unknown as Product[]).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
            <p className="font-display text-lg">Nothing listed yet</p>
            <p className="max-w-sm text-sm text-slate">
              Once a business adds products from their dashboard, they&apos;ll show up here.
            </p>
            <Link href="/business/signup" className="btn-primary mt-4">
              Register a business
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
