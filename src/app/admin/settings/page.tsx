import Link from "next/link";
import { requireBusiness } from "@/lib/business";
import { updateBusinessProfile } from "./actions";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const { business } = await requireBusiness();

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl">Storefront settings</h1>
      <p className="mt-1 text-sm text-slate">
        This is what customers see on your public seller page —{" "}
        <Link href={`/sellers/${business.slug}`} className="text-evergreen hover:underline" target="_blank">
          view it live ↗
        </Link>
      </p>

      {searchParams.saved && (
        <p className="mt-4 rounded-xl bg-evergreen-50 px-4 py-2.5 text-sm text-evergreen dark:bg-evergreen-700/20">
          Settings saved.
        </p>
      )}
      {searchParams.error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-950/30">
          Something went wrong saving your settings. If this project's database was set up before
          location/WhatsApp fields were added, run{" "}
          <code>supabase/migrations/002_seller_location_contact.sql</code> in the Supabase SQL editor,
          then try again.
        </p>
      )}

      <form action={updateBusinessProfile} className="mt-8 space-y-4">
        <div>
          <label className="label-eyebrow mb-1.5 block">Business name</label>
          <input name="name" required defaultValue={business.name} className="input" />
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Description</label>
          <textarea name="description" rows={3} defaultValue={business.description ?? ""} className="input" />
        </div>

        <div className="border-t border-line dark:border-line-dark pt-4">
          <p className="label-eyebrow mb-3">Location</p>
          <div className="space-y-3">
            <input name="address" placeholder="Street address" defaultValue={business.address ?? ""} className="input" />
            <div className="grid grid-cols-2 gap-3">
              <input name="city" placeholder="City" defaultValue={business.city ?? ""} className="input" />
              <input name="country" placeholder="Country" defaultValue={business.country ?? ""} className="input" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate">Shown on your public seller page so buyers know where you&apos;re based.</p>
        </div>

        <div className="border-t border-line dark:border-line-dark pt-4">
          <p className="label-eyebrow mb-3">WhatsApp contact</p>
          <input
            name="whatsapp_number"
            type="tel"
            placeholder="+1 555 123 4567"
            defaultValue={business.whatsapp_number ?? ""}
            className="input"
          />
          <p className="mt-2 text-xs text-slate">
            Include the country code. Leave blank to hide the WhatsApp button on your storefront.
          </p>
        </div>

        <button type="submit" className="btn-primary">
          Save changes
        </button>
      </form>
    </div>
  );
}
