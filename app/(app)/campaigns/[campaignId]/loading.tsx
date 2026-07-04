import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/app/table-skeleton";

export default function CampaignDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-9 w-64" />
      <TableSkeleton rows={6} columns={4} />
    </div>
  );
}
