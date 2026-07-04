import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";

/** Placeholder for nav destinations whose module is built in a later phase. */
export function ModulePlaceholder({
  title,
  description,
  icon,
  note,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  note: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState icon={icon} title={`${title} arrives in a later phase`} description={note} />
    </div>
  );
}
