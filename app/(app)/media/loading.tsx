import { PageHeader } from "@/components/app/page-header";
import { TableSkeleton } from "@/components/app/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function MediaLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Database"
        description="India-first journalists and publications, built and maintained in-house."
      />
      <Skeleton className="h-9 w-56" />
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-44" />
      </div>
      <TableSkeleton rows={8} columns={6} />
    </div>
  );
}
