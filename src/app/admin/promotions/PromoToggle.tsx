"use client";

import { useTransition } from "react";
import { togglePromoCode } from "./actions";

export default function PromoToggle({ promoId, isActive }: { promoId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => togglePromoCode(promoId, !isActive))}
      className={`rounded-full px-2.5 py-1 text-xs ${isActive ? "bg-evergreen-100 text-evergreen-700" : "bg-slate/20 text-slate"}`}
    >
      {isActive ? "Active" : "Paused"}
    </button>
  );
}
