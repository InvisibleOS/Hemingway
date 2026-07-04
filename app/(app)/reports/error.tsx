"use client";

import { PageHeader } from "@/components/app/page-header";
import { ErrorState } from "@/components/app/error-state";

export default function ReportsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Monthly coverage, links and AI visibility." />
      <ErrorState
        title="Report failed to load"
        description="The metrics and coverage for this client could not be fetched. Check the database connection and try again."
        retry={reset}
      />
    </div>
  );
}
