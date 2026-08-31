import { createClient } from "@/lib/supabase/server";
import { requireBusiness } from "@/lib/business";
import ChatThread from "@/components/ChatThread";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: { customer?: string };
}) {
  const { business } = await requireBusiness();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: threads, error } = await supabase
    .from("messages")
    .select("customer_id, body, created_at, profiles(full_name)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load message threads:", error.message);
    throw new Error(`Could not load your messages: ${error.message}`);
  }

  type Thread = { customer_id: string; body: string; created_at: string; profiles: { full_name: string | null } | null };
  const threadList = (threads ?? []) as unknown as Thread[];

  const seen = new Set<string>();
  const uniqueThreads = threadList.filter((t) => {
    if (seen.has(t.customer_id)) return false;
    seen.add(t.customer_id);
    return true;
  });

  const activeCustomer = searchParams.customer ?? uniqueThreads[0]?.customer_id;

  return (
    <div>
      <h1 className="font-display text-3xl">Messages</h1>

      <div className="card mt-6 grid overflow-hidden md:grid-cols-[240px_1fr]">
        <div className="border-r border-line dark:border-line-dark">
          {uniqueThreads.length > 0 ? (
            uniqueThreads.map((t) => (
              <a
                key={t.customer_id}
                href={`/admin/messages?customer=${t.customer_id}`}
                className={`block border-b border-line dark:border-line-dark px-4 py-3 text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.04] ${
                  t.customer_id === activeCustomer ? "bg-black/[0.03] dark:bg-white/[0.04]" : ""
                }`}
              >
                <p className="font-medium">{t.profiles?.full_name ?? "Customer"}</p>
                <p className="line-clamp-1 text-xs text-slate">{t.body}</p>
              </a>
            ))
          ) : (
            <p className="p-4 text-sm text-slate">No conversations yet.</p>
          )}
        </div>
        <div>
          {activeCustomer && user ? (
            <ChatThread businessId={business.id} customerId={activeCustomer} currentUserId={user.id} />
          ) : (
            <div className="flex h-[420px] items-center justify-center text-sm text-slate">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
