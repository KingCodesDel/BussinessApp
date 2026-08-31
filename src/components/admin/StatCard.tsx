import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="label-eyebrow">{label}</p>
        <Icon className="h-4 w-4 text-slate" />
      </div>
      <p className="mt-2 font-display text-2xl">{value}</p>
      {trend && <p className="mt-1 text-xs text-evergreen">{trend}</p>}
    </div>
  );
}
