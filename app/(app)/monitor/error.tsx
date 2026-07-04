"use client";

import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";

export default function MonitorError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Monitor" description="Expert requests and brand mentions per client." />
      <ErrorState
        title="Monitor feed failed to load"
        description="The monitor events could not be fetched. Check the database connection and try again."
        retry={reset}
      />
    </div>
  );
}
