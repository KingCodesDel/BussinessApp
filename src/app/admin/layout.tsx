import { requireBusiness } from "@/lib/business";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { business, role } = await requireBusiness();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:gap-8 md:py-8">
      <AdminNav businessName={business.name} role={role} plan={business.plan} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
