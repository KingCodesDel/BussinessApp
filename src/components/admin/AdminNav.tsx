"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Star,
  MessageSquare,
  Settings,
  Menu,
  X,
} from "lucide-react";
import Seal from "@/components/Seal";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/promotions", label: "Promotions", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export default function AdminNav({
  businessName,
  role,
  plan,
}: {
  businessName: string;
  role: string;
  plan: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar — visible below md, replaces the hidden desktop sidebar */}
      <div className="mb-4 flex items-center justify-between md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Seal className="h-7 w-7 shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-display text-sm leading-tight">{businessName}</p>
            <p className="text-[11px] capitalize text-slate">
              {role} · {plan} plan
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Open dashboard menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile slide-out drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-porcelain dark:bg-ink p-5 shadow-card animate-fade-up">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Seal className="h-7 w-7" />
                <p className="font-display text-sm">{businessName}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {nav.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-evergreen-100 text-evergreen-700 dark:bg-evergreen-700/20 dark:text-evergreen-100"
                        : "text-slate hover:bg-black/5 hover:text-ink dark:hover:bg-white/5 dark:hover:text-porcelain"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="mt-4 block border-t border-line dark:border-line-dark pt-4 text-xs text-slate hover:text-evergreen"
            >
              ← Back to storefront
            </Link>
          </div>
        </div>
      )}

      {/* Desktop sidebar — visible at md and up */}
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="mb-6 flex items-center gap-2">
          <Seal className="h-7 w-7" />
          <div>
            <p className="font-display text-sm leading-tight">{businessName}</p>
            <p className="text-[11px] capitalize text-slate">
              {role} · {plan} plan
            </p>
          </div>
        </div>
        <nav className="space-y-1">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                  active
                    ? "bg-evergreen-100 text-evergreen-700 dark:bg-evergreen-700/20 dark:text-evergreen-100"
                    : "text-slate hover:bg-black/5 hover:text-ink dark:hover:bg-white/5 dark:hover:text-porcelain"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/" className="mt-8 block text-xs text-slate hover:text-evergreen">
          ← Back to storefront
        </Link>
      </aside>
    </>
  );
}
