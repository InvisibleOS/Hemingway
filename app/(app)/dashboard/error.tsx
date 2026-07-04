"use client";

import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="What needs attention today, across every client." />
      <ErrorState
        title="Dashboard failed to load"
        description="The queues could not be fetched. Check the database connection and try again."
        retry={reset}
      />
    </div>
  );
}
