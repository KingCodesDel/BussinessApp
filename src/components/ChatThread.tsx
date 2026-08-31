"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

interface RealtimeMessage extends Message {
  business_id: string;
  customer_id: string;
}

export default function ChatThread({
  businessId,
  customerId,
  currentUserId,
}: {
  businessId: string;
  customerId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("business_id", businessId)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) {
        console.error("Failed to load messages:", error.message);
        setLoadError(error.message);
      } else {
        setLoadError(null);
        setMessages(data ?? []);
      }
      setLoading(false);
    })();

    // Filtering on customer_id alone isn't enough — the same customer can have
    // threads with multiple businesses, so we also check business_id in the
    // callback to avoid a message from one seller's thread leaking into another's.
    const channel = supabase
      .channel(`messages-${businessId}-${customerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `customer_id=eq.${customerId}` },
        (payload) => {
          const incoming = payload.new as RealtimeMessage;
          if (incoming.business_id !== businessId) return;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, customerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!draft.trim()) return;
    const body = draft;
    setDraft("");
    setSendError(null);
    // Add the sent message straight to local state — don't rely solely on the
    // realtime event, since that requires Replication to be enabled on the
    // `messages` table. Without this, sent messages would appear to vanish
    // until the page is refreshed.
    const { data, error } = await supabase
      .from("messages")
      .insert({ business_id: businessId, customer_id: customerId, sender_id: currentUserId, body })
      .select("id, sender_id, body, created_at")
      .single();
    if (error || !data) {
      console.error("Failed to send message:", error?.message);
      setSendError(error?.message ?? "Message failed to send.");
      setDraft(body); // put the text back so nothing is lost
      return;
    }
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
  };

  return (
    <div className="flex h-[420px] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {loading && <p className="mt-8 text-center text-sm text-slate">Loading…</p>}
        {loadError && (
          <p className="mt-8 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/30">
            Couldn&apos;t load this conversation: {loadError}
          </p>
        )}
        {!loading &&
          !loadError &&
          messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                m.sender_id === currentUserId
                  ? "ml-auto bg-evergreen text-white"
                  : "bg-black/5 dark:bg-white/10"
              }`}
            >
              {m.body}
            </div>
          ))}
        {!loading && !loadError && messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-slate">Say hello — a real person will reply here.</p>
        )}
        <div ref={bottomRef} />
      </div>
      {sendError && (
        <p className="border-t border-line dark:border-line-dark px-3 pt-2 text-xs text-red-600">
          Couldn&apos;t send: {sendError}
        </p>
      )}
      <div className="flex items-center gap-2 border-t border-line dark:border-line-dark p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          className="input flex-1"
        />
        <button onClick={send} className="btn-primary px-3.5" aria-label="Send message">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
