import { PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function MonitorLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Monitor" description="Expert requests and brand mentions per client." />
      <Skeleton className="h-4 w-40" />
      <div className="grid gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
