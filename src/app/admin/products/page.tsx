import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/business";
import DeleteProductButton from "./DeleteProductButton";

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "usd" }).format(cents / 100);
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { created?: string; updated?: string; image_errors?: string };
}) {
  const { business } = await requireBusiness();
  const supabase = createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      {(searchParams.created || searchParams.updated) && !searchParams.image_errors && (
        <p className="mt-4 rounded-xl bg-evergreen-50 px-4 py-2.5 text-sm text-evergreen dark:bg-evergreen-700/20">
          {searchParams.created ? "Product created." : "Product updated."}
        </p>
      )}
      {searchParams.image_errors && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Product saved, but {searchParams.image_errors} image
          {searchParams.image_errors === "1" ? "" : "s"} failed to upload. This usually means the
          storage bucket policies haven't been set up yet — run{" "}
          <code>supabase/migrations/003_storage_policies.sql</code> in the Supabase SQL editor, then
          edit this product to try uploading again.
        </p>
      )}

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line dark:border-line-dark text-left text-xs text-slate">
            <tr>
              <th className="px-5 py-3 font-normal">Product</th>
              <th className="px-5 py-3 font-normal">Price</th>
              <th className="px-5 py-3 font-normal">Stock</th>
              <th className="px-5 py-3 font-normal">Status</th>
              <th className="px-5 py-3 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line dark:divide-line-dark">
            {products && products.length > 0 ? (
              products.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3">
                    <Link href={`/admin/products/${p.id}`} className="hover:text-evergreen">
                      {p.title}
                    </Link>
                  </td>
                  <td className="price px-5 py-3">{formatPrice(p.price_cents)}</td>
                  <td className="px-5 py-3">
                    <span className={p.stock_quantity === 0 ? "text-red-600" : ""}>{p.stock_quantity}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${p.is_active ? "bg-evergreen-100 text-evergreen-700" : "bg-slate/20 text-slate"}`}
                    >
                      {p.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <DeleteProductButton productId={p.id} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate">
                  No products yet — add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
