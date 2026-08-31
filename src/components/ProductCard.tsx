import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { Product } from "@/types/database";
import WishlistButton from "./WishlistButton";

function formatPrice(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export default function ProductCard({ product }: { product: Product }) {
  const image = product.product_images?.[0]?.url;

  return (
    <div className="group relative animate-fade-up">
      <Link href={`/products/${product.slug}`} className="card block overflow-hidden">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-line/40 dark:bg-line-dark/40">
          {image ? (
            <Image
              src={image}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate text-sm">No image</div>
          )}
          {product.compare_at_cents && product.compare_at_cents > product.price_cents && (
            <span className="absolute left-3 top-3 rounded-full bg-evergreen px-2.5 py-1 text-[11px] font-mono text-white">
              SALE
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="line-clamp-1 font-display text-[15px]">{product.title}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            {product.avg_rating > 0 ? product.avg_rating.toFixed(1) : "New"}
            {product.review_count > 0 && <span>({product.review_count})</span>}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="price text-sm">{formatPrice(product.price_cents, product.currency)}</span>
            {product.compare_at_cents && (
              <span className="price text-xs text-slate line-through">
                {formatPrice(product.compare_at_cents, product.currency)}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="absolute right-3 top-3">
        <WishlistButton productId={product.id} />
      </div>
    </div>
  );
}
