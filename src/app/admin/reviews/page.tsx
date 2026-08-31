import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/business";
import StarRating from "@/components/StarRating";

interface AdminReviewRow {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
  products: { title: string } | null;
}

export default async function AdminReviewsPage() {
  const { business } = await requireBusiness();
  const supabase = createClient();

  const { data: products } = await supabase.from("products").select("id").eq("business_id", business.id);
  const productIds = (products ?? []).map((p) => p.id);

  const { data: reviewsRaw } = productIds.length
    ? await supabase
        .from("reviews")
        .select("*, profiles(full_name), products(title)")
        .in("product_id", productIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const reviews = (reviewsRaw ?? []) as unknown as AdminReviewRow[];

  return (
    <div>
      <h1 className="font-display text-3xl">Reviews</h1>
      <div className="mt-6 space-y-4">
        {reviews && reviews.length > 0 ? (
          reviews.map((r) => (
            <div key={r.id} className="card flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium">{r.products?.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <StarRating rating={r.rating} size={12} />
                  <span className="text-xs text-slate">{r.profiles?.full_name ?? "Verified buyer"}</span>
                </div>
                {r.body && <p className="mt-2 text-sm text-slate">{r.body}</p>}
              </div>
              <span className="text-xs text-slate shrink-0">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
          ))
        ) : (
          <div className="card px-6 py-16 text-center text-slate">No reviews yet.</div>
        )}
      </div>
    </div>
  );
}
