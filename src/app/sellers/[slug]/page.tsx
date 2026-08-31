import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import Seal from "@/components/Seal";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { Business, Product } from "@/types/database";

export default async function SellerPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load seller:", error.message);
    throw new Error(`Could not load this seller: ${error.message}`);
  }
  if (!business) notFound();
  const b = business as Business;

  const { data: products } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("business_id", b.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const location = [b.city, b.country].filter(Boolean).join(", ");
  const whatsappLink = b.whatsapp_number
    ? buildWhatsAppLink(b.whatsapp_number, `Hi ${b.name}, I have a question about your products on Velora.`)
    : null;

  return (
    <div>
      {/* Seller header */}
      <div className="border-b border-line dark:border-line-dark bg-gradient-to-b from-evergreen-50 to-transparent dark:from-evergreen-700/20">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface dark:bg-surface-dark shadow-card">
              <Seal className="h-9 w-9" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-3xl">{b.name}</h1>
              {location && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                  {b.address && ` · ${b.address}`}
                </p>
              )}
            </div>
          </div>

          {b.description && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate">{b.description}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/support?business=${b.id}`} className="btn-secondary">
              <MessageSquare className="h-4 w-4" />
              Message on Velora
            </Link>
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="font-display text-2xl">
          {products && products.length > 0 ? `${products.length} product${products.length === 1 ? "" : "s"}` : "Products"}
        </h2>
        {products && products.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(products as unknown as Product[]).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate">This seller hasn&apos;t listed any products yet.</p>
        )}
      </div>
    </div>
  );
}
