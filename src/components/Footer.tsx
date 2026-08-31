import Link from "next/link";
import { Coffee } from "lucide-react";
import Seal from "./Seal";

const COFFEE_URL = process.env.NEXT_PUBLIC_COFFEE_URL || "https://www.buymeacoffee.com/";

export default function Footer() {
  return (
    <footer className="border-t border-line dark:border-line-dark mt-24">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Seal className="h-7 w-7" />
              <span className="font-display text-lg">Velora</span>
            </div>
            <p className="mt-2 max-w-xs text-sm text-slate">
              A storefront platform for independent makers and growing businesses.
            </p>
            <a
              href={COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-evergreen hover:underline"
            >
              <Coffee className="h-4 w-4" />
              Buy the developer a coffee
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="label-eyebrow mb-3">Shop</p>
              <ul className="space-y-2 text-slate">
                <li><Link href="/shop">All products</Link></li>
                <li><Link href="/sellers">Browse sellers</Link></li>
                <li><Link href="/orders">Track an order</Link></li>
              </ul>
            </div>
            <div>
              <p className="label-eyebrow mb-3">Business</p>
              <ul className="space-y-2 text-slate">
                <li><Link href="/business/signup">Start selling</Link></li>
                <li><Link href="/business/login">Business login</Link></li>
                <li><Link href="/admin">Owner dashboard</Link></li>
              </ul>
            </div>
            <div>
              <p className="label-eyebrow mb-3">Support</p>
              <ul className="space-y-2 text-slate">
                <li><Link href="/support">Help center</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs text-slate">© {new Date().getFullYear()} Velora. All rights reserved.</p>
      </div>
    </footer>
  );
}
