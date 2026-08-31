import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import StarRating from "@/components/StarRating";
import ProductCard from "@/components/ProductCard";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { Product, Review, Business } from "@/types/database";

function formatPrice(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: product, error } = await supabase
    .from("products")
    .select("*, product_images(*), businesses(*)")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    // A real database/query error (bad column, RLS misconfig, etc). Throwing
    // here surfaces it as a proper error page instead of a misleading 404 —
    // "not found" should only ever mean the product genuinely doesn't exist.
    console.error("Failed to load product:", error.message);
    throw new Error(`Could not load this product: ${error.message}`);
  }
  if (!product) notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, profiles(full_name)")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const p = product as unknown as Product & { businesses: Business };
  const images = p.product_images?.length ? p.product_images : [];

  const { data: moreFromSeller } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("business_id", p.businesses.id)
    .eq("is_active", true)
    .neq("id", p.id)
    .limit(4);

  const whatsappLink = p.businesses.whatsapp_number
    ? buildWhatsAppLink(
        p.businesses.whatsapp_number,
        `Hi ${p.businesses.name}, I'm interested in "${p.title}" on Velora.`
      )
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-line/40 dark:bg-line-dark/40">
            {images[0] ? (
              <Image src={images[0].url} alt={p.title} fill sizes="50vw" className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-slate text-sm">No image available</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-line/40 dark:bg-line-dark/40">
                  <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
          {p.video_url && (
            <video controls className="mt-3 w-full rounded-xl" src={p.video_url} />
          )}
        </div>

        {/* Details */}
        <div>
          <Link href={`/sellers/${p.businesses.slug}`} className="label-eyebrow hover:text-evergreen transition">
            {p.businesses?.name}
          </Link>
          <div className="mt-2 flex items-start justify-between gap-3">
            <h1 className="font-display text-3xl">{p.title}</h1>
            <WishlistButton productId={p.id} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={p.avg_rating} />
            <span className="text-sm text-slate">
              {p.review_count > 0 ? `${p.review_count} reviews` : "No reviews yet"}
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="price text-2xl">{formatPrice(p.price_cents, p.currency)}</span>
            {p.compare_at_cents && (
              <span className="price text-base text-slate line-through">
                {formatPrice(p.compare_at_cents, p.currency)}
              </span>
            )}
          </div>

          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate">{p.description}</p>

          <div className="mt-8">
            <AddToCartButton productId={p.id} inStock={p.stock_quantity > 0} />
            <p className="mt-2 text-xs text-slate">
              {p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : "Currently unavailable"}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/support?business=${p.businesses.id}`} className="btn-secondary text-sm">
              <MessageSquare className="h-4 w-4" />
              Ask the seller
            </Link>
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* More from this seller */}
      {moreFromSeller && moreFromSeller.length > 0 && (
        <section className="mt-16 border-t border-line dark:border-line-dark pt-10">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl">More from {p.businesses.name}</h2>
            <Link href={`/sellers/${p.businesses.slug}`} className="text-sm text-evergreen hover:underline">
              View storefront
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(moreFromSeller as unknown as Product[]).map((mp) => (
              <ProductCard key={mp.id} product={mp} />
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="mt-16 border-t border-line dark:border-line-dark pt-10">
        <h2 className="font-display text-2xl">Customer reviews</h2>
        {reviews && reviews.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {(reviews as unknown as (Review & { profiles: { full_name: string | null } })[]).map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{r.profiles?.full_name ?? "Verified buyer"}</p>
                  <StarRating rating={r.rating} size={12} />
                </div>
                {r.body && <p className="mt-2 text-sm text-slate">{r.body}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate">Be the first to review this product after purchase.</p>
        )}
      </section>
    </div>
  );
}
