"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, ShoppingBag, Moon, Sun, User, Menu, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import Seal from "./Seal";

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { count } = useCart();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line dark:border-line-dark bg-porcelain/90 dark:bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Seal className="h-8 w-8" />
          <span className="font-display text-xl tracking-tight">Velora</span>
        </Link>

        <form action="/shop" className="relative hidden flex-1 max-w-md md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <input
            name="q"
            placeholder="Search products…"
            className="input pl-9"
            aria-label="Search products"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-6 text-sm md:flex">
          <Link href="/shop" className="hover:text-evergreen transition">
            Shop
          </Link>
          <Link href="/sellers" className="hover:text-evergreen transition">
            Sellers
          </Link>
          <Link href="/wishlist" className="hover:text-evergreen transition">
            Wishlist
          </Link>
          <Link href="/orders" className="hover:text-evergreen transition">
            Orders
          </Link>
        </nav>

        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        <Link
          href="/cart"
          className="relative rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10 transition"
          aria-label="Cart"
        >
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-mono text-ink">
              {count}
            </span>
          )}
        </Link>

        <Link
          href={userEmail ? "/profile" : "/login"}
          className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10 transition"
          aria-label="Account"
        >
          <User className="h-5 w-5" />
        </Link>

        <button
          className="rounded-lg p-2 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-line dark:border-line-dark px-4 py-3 md:hidden animate-fade-up">
          <form action="/shop" className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <input name="q" placeholder="Search products…" className="input pl-9" />
          </form>
          <div className="flex flex-col gap-3 text-sm">
            <Link href="/shop" onClick={() => setMenuOpen(false)}>Shop</Link>
            <Link href="/sellers" onClick={() => setMenuOpen(false)}>Sellers</Link>
            <Link href="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist</Link>
            <Link href="/orders" onClick={() => setMenuOpen(false)}>Orders</Link>
            <Link
              href="/business/login"
              onClick={() => setMenuOpen(false)}
              className="mt-2 border-t border-line dark:border-line-dark pt-3 text-evergreen"
            >
              Business login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
