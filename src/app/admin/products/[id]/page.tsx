import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/business";
import { updateProduct } from "../actions";
import DeleteImageButton from "./DeleteImageButton";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { business } = await requireBusiness();
  const supabase = createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("id", params.id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load product for edit:", error.message);
    throw new Error(`Could not load this product: ${error.message}`);
  }
  if (!product) notFound();

  const updateWithId = updateProduct.bind(null, product.id);
  const images = (product.product_images ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Edit product</h1>

      {images.length > 0 && (
        <div className="mt-6">
          <p className="label-eyebrow mb-2">Current images</p>
          <div className="flex flex-wrap gap-3">
            {images.map((img: { id: string; url: string }) => (
              <div key={img.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-line/40 dark:bg-line-dark/40">
                <Image src={img.url} alt="" fill className="object-cover" />
                <DeleteImageButton imageId={img.id} productId={product.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      <form action={updateWithId} className="mt-8 space-y-4">
        <div>
          <label className="label-eyebrow mb-1.5 block">Title</label>
          <input name="title" required defaultValue={product.title} className="input" />
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Description</label>
          <textarea name="description" rows={4} defaultValue={product.description ?? ""} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-eyebrow mb-1.5 block">Price (USD)</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={(product.price_cents / 100).toFixed(2)}
              className="input"
            />
          </div>
          <div>
            <label className="label-eyebrow mb-1.5 block">Stock quantity</label>
            <input
              name="stock"
              type="number"
              min="0"
              required
              defaultValue={product.stock_quantity}
              className="input"
            />
          </div>
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Add more images</label>
          <input name="images" type="file" accept="image/*" multiple className="input" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={product.is_active} className="h-4 w-4" />
          Visible in storefront
        </label>
        <button type="submit" className="btn-primary">
          Save changes
        </button>
      </form>
    </div>
  );
}
