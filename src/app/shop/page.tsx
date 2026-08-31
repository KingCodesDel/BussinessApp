import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/database";

export const revalidate = 30;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; sort?: string };
}) {
  const supabase = createClient();

  const hasCategoryFilter = !!searchParams.category;

  // The inner join is only needed (and only safe) when filtering by category —
  // it's how PostgREST lets a dotted filter restrict the parent rows. Using it
  // unconditionally would silently hide every product with no category set,
  // since an inner join excludes rows with no matching related row at all.
  let query = supabase
    .from("products")
    .select(hasCategoryFilter ? "*, product_images(*), categories!inner(slug,name)" : "*, product_images(*)")
    .eq("is_active", true);

  if (searchParams.q) {
    query = query.textSearch("title", searchParams.q, { type: "websearch" });
  }
  if (hasCategoryFilter) {
    query = query.eq("categories.slug", searchParams.category);
  }
  if (searchParams.sort === "price_asc") query = query.order("price_cents", { ascending: true });
  else if (searchParams.sort === "price_desc") query = query.order("price_cents", { ascending: false });
  else if (searchParams.sort === "rating") query = query.order("avg_rating", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data: products } = await query.limit(48);
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl">
          {searchParams.q ? `Results for "${searchParams.q}"` : "Shop all"}
        </h1>
        <form className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="q" value={searchParams.q ?? ""} />
          <input type="hidden" name="category" value={searchParams.category ?? ""} />
          <select name="sort" defaultValue={searchParams.sort ?? ""} className="input w-auto text-sm">
            <option value="">Sort: newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
          <button className="btn-secondary text-sm">Apply</button>
        </form>
      </div>

      {/* Mobile category filter — the sidebar below is desktop-only, so this
          horizontally-scrolling chip row is how mobile visitors filter. */}
      {categories && categories.length > 0 && (
        <div className="mb-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
          <a
            href="/shop"
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${
              !searchParams.category
                ? "border-evergreen bg-evergreen-50 text-evergreen dark:bg-evergreen-700/20"
                : "border-line dark:border-line-dark"
            }`}
          >
            All
          </a>
          {categories.map((c) => (
            <a
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${
                searchParams.category === c.slug
                  ? "border-evergreen bg-evergreen-50 text-evergreen dark:bg-evergreen-700/20"
                  : "border-line dark:border-line-dark"
              }`}
            >
              {c.name}
            </a>
          ))}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <aside className="hidden md:block">
          <p className="label-eyebrow mb-3">Categories</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/shop" className={!searchParams.category ? "text-evergreen" : ""}>
                All
              </a>
            </li>
            {categories?.map((c) => (
              <li key={c.id}>
                <a
                  href={`/shop?category=${c.slug}`}
                  className={searchParams.category === c.slug ? "text-evergreen" : ""}
                >
                  {c.name}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <div>
          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {(products as unknown as Product[]).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="card px-6 py-16 text-center">
              <p className="font-display text-lg">No products found</p>
              <p className="mt-1 text-sm text-slate">Try a different search or clear filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
