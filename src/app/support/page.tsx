import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatThread from "@/components/ChatThread";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: { business?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/support${searchParams.business ? `?business=${searchParams.business}` : ""}`);

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("business_id, businesses(name)")
    .eq("customer_id", user.id);

  if (ordersError) {
    console.error("Failed to load support threads:", ordersError.message);
    throw new Error(`Could not load your conversations: ${ordersError.message}`);
  }

  const seen = new Set<string>();
  const businesses = (orders ?? [])
    .filter((o) => {
      if (seen.has(o.business_id)) return false;
      seen.add(o.business_id);
      return true;
    })
    .map((o) => ({ id: o.business_id, name: (o.businesses as unknown as { name: string })?.name }));

  // If the visitor arrived from a seller/product page (before ordering), make
  // sure that seller shows up in the list so they can start the conversation.
  if (searchParams.business && !seen.has(searchParams.business)) {
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("id", searchParams.business)
      .eq("is_active", true)
      .maybeSingle();
    if (businessError) {
      console.error("Failed to load seller for support thread:", businessError.message);
    } else if (business) {
      businesses.unshift({ id: business.id, name: business.name });
    }
  }

  const activeBusiness = searchParams.business ?? businesses[0]?.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">Support</h1>

      {businesses.length === 0 ? (
        <div className="card mt-8 px-6 py-16 text-center text-slate">
          Visit a seller&apos;s page and tap &quot;Message on Velora&quot;, or place an order — either way,
          you&apos;ll be able to chat with that business here.
        </div>
      ) : (
        <div className="card mt-8 grid overflow-hidden md:grid-cols-[220px_1fr]">
          <div className="border-r border-line dark:border-line-dark">
            {businesses.map((b) => (
              <a
                key={b.id}
                href={`/support?business=${b.id}`}
                className={`block border-b border-line dark:border-line-dark px-4 py-3 text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.04] ${
                  b.id === activeBusiness ? "bg-black/[0.03] dark:bg-white/[0.04]" : ""
                }`}
              >
                {b.name}
              </a>
            ))}
          </div>
          <div>
            {activeBusiness && (
              <ChatThread businessId={activeBusiness} customerId={user.id} currentUserId={user.id} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
