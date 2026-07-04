import { Skeleton } from "@/components/ui/skeleton";

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
      {/* Two-pane Approvals shape: a queue list beside the editor. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <div className="space-y-2 rounded-lg border bg-card p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5 border-b pb-2.5 last:border-0">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </div>
  );
}
