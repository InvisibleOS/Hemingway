"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type Column, type SortState } from "@/components/app/data-table";
import { StatusPill } from "@/components/app/status-pill";
import { RelativeTime } from "@/components/app/relative-time";
import { EmptyState } from "@/components/app/empty-state";
import { emailStatusMeta, EMAIL_STATUS_META } from "@/lib/status";
import type { EmailStatus, Publication, Vertical } from "@/lib/db/types";
import type {
  JournalistListPage,
  JournalistSortColumn,
  JournalistWithPublication,
} from "@/lib/db/journalists";
import { JournalistFilters } from "./journalist-filters";
import { JournalistDrawer } from "./journalist-drawer";
import { ReceptivityFlags } from "./receptivity-flags";
import { useMediaParams } from "./use-media-params";
import { verifyJournalistEmailAction } from "../actions";

type StatusOverride = { status: EmailStatus; verifiedAt: string | null };

export function JournalistsPanel({
  data,
  publications,
  filters,
  verifierSandbox,
}: {
  data: JournalistListPage;
  publications: Publication[];
  filters: {
    vertical: Vertical | "all";
    publicationId: string | "all";
    emailStatus: EmailStatus | "all";
    search: string;
    sort: JournalistSortColumn;
    dir: "asc" | "desc";
  };
  verifierSandbox: boolean;
}) {
  const router = useRouter();
  const { setParams } = useMediaParams();
  const [selected, setSelected] = React.useState<JournalistWithPublication | null>(null);
  const [overrides, setOverrides] = React.useState<Record<string, StatusOverride>>({});
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);

  const statusOf = (j: JournalistWithPublication): EmailStatus =>
    overrides[j.id]?.status ?? j.email_status;
  const verifiedAtOf = (j: JournalistWithPublication): string | null =>
    j.id in overrides ? overrides[j.id].verifiedAt : j.email_verified_at;

  const handleVerify = (journalist: JournalistWithPublication) => {
    setVerifyingId(journalist.id);
    verifyJournalistEmailAction(journalist.id)
      .then((res) => {
        setOverrides((prev) => ({
          ...prev,
          [journalist.id]: { status: res.status, verifiedAt: res.verifiedAt },
        }));
        toast("Verification complete", {
          description: `${journalist.name}: ${EMAIL_STATUS_META[res.status].label.toLowerCase()}`,
        });
        router.refresh();
      })
      .catch(() => toast.error("Verification failed", { description: "Try again shortly." }))
      .finally(() => setVerifyingId(null));
  };

  const sort: SortState = { column: filters.sort, dir: filters.dir };

  const columns: Column<JournalistWithPublication>[] = [
    {
      id: "name",
      header: "Name",
      sortId: "name",
      cell: (j) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{j.name}</div>
          {j.role && <div className="truncate text-xs text-muted-foreground">{j.role}</div>}
        </div>
      ),
    },
    {
      id: "publication",
      header: "Publication",
      cell: (j) => <span className="text-sm">{j.publication.name}</span>,
    },
    {
      id: "beat",
      header: "Beat",
      cell: (j) => (
        <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">
          {j.beat_summary ?? "Not profiled"}
        </span>
      ),
    },
    {
      id: "signals",
      header: "Signals",
      cell: (j) => (
        <ReceptivityFlags
          quotesFounders={j.quotes_founders}
          usesDataStudies={j.uses_data_studies}
        />
      ),
    },
    {
      id: "email",
      header: "Email",
      sortId: "email_status",
      cell: (j) => <StatusPill {...emailStatusMeta(statusOf(j))} />,
    },
    {
      id: "last_profiled_at",
      header: "Last profiled",
      sortId: "last_profiled_at",
      align: "right",
      cell: (j) => (
        <span className="text-sm text-muted-foreground">
          <RelativeTime iso={j.last_profiled_at} />
        </span>
      ),
    },
  ];

  const { total, page, pageSize } = data;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasFilters =
    filters.vertical !== "all" ||
    filters.publicationId !== "all" ||
    filters.emailStatus !== "all" ||
    filters.search.trim().length > 0;

  return (
    <div className="space-y-4">
      <JournalistFilters
        vertical={filters.vertical}
        publicationId={filters.publicationId}
        emailStatus={filters.emailStatus}
        search={filters.search}
        publications={publications}
      />

      {data.rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? "No journalists match these filters" : "No journalists yet"}
          description={
            hasFilters
              ? "Adjust or clear the filters to see more."
              : "Add a publication to ingest its journalists into the database."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setParams(
                    { vertical: null, publication: null, email: null, q: null },
                    { resetPage: true },
                  )
                }
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data.rows}
            getRowId={(j) => j.id}
            onRowClick={(j) => setSelected(j)}
            activeRowId={selected?.id ?? null}
            sort={sort}
            onSortChange={(next) => setParams({ sort: next.column, dir: next.dir })}
            className="max-h-[calc(100svh-19rem)]"
          />

          <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <span className="tabular-nums">
              {from}-{to} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setParams({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={to >= total}
                onClick={() => setParams({ page: String(page + 1) })}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <JournalistDrawer
        journalist={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        emailStatus={selected ? statusOf(selected) : "unverified"}
        emailVerifiedAt={selected ? verifiedAtOf(selected) : null}
        verifierSandbox={verifierSandbox}
        verifying={verifyingId === selected?.id}
        onVerify={() => selected && handleVerify(selected)}
      />
    </div>
  );
}
