import Link from "next/link";
import Seal from "@/components/Seal";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <Seal className="h-10 w-10 opacity-60" />
      <h1 className="mt-4 font-display text-3xl">Page not found</h1>
      <p className="mt-2 text-sm text-slate">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
