import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/business";
import { createProduct, createCategory } from "../actions";

export default async function NewProductPage() {
  const { business } = await requireBusiness();
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("business_id", business.id)
    .order("name");

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Add a product</h1>

      <form action={createProduct} className="mt-8 space-y-4">
        <div>
          <label className="label-eyebrow mb-1.5 block">Title</label>
          <input name="title" required className="input" placeholder="Hand-thrown ceramic mug" />
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Description</label>
          <textarea name="description" rows={4} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-eyebrow mb-1.5 block">Price (USD)</label>
            <input name="price" type="number" step="0.01" min="0" required className="input" />
          </div>
          <div>
            <label className="label-eyebrow mb-1.5 block">Stock quantity</label>
            <input name="stock" type="number" min="0" defaultValue={0} required className="input" />
          </div>
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Category</label>
          <select name="category_id" className="input">
            <option value="">Uncategorized</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Product images</label>
          <input name="images" type="file" accept="image/*" multiple className="input" />
          <p className="mt-1 text-xs text-slate">
            Uploads to Supabase Storage — create a public bucket named{" "}
            <code>product-images</code> first (see README → Storage setup).
          </p>
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Video URL (optional)</label>
          <input name="video_url" type="url" className="input" placeholder="https://…" />
        </div>
        <button type="submit" className="btn-primary">
          Create product
        </button>
      </form>

      <details className="mt-8">
        <summary className="cursor-pointer text-sm text-evergreen">+ Quick-add a category</summary>
        <form action={createCategory} className="mt-3 flex gap-2">
          <input name="name" required className="input" placeholder="e.g. Home & Kitchen" />
          <button type="submit" className="btn-secondary shrink-0">
            Add
          </button>
        </form>
      </details>
    </div>
  );
}
