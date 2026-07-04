import { providerIsMock } from "@/lib/providers";
import {
  getJournalistCountsByPublication,
  listJournalistsWithPublication,
  listPublications,
} from "@/lib/db";
import type { EmailStatus, Vertical } from "@/lib/db/types";
import type { JournalistSortColumn } from "@/lib/db/journalists";
import { PageHeader } from "@/components/app/page-header";
import { AddPublicationButton } from "./_components/add-publication";
import { MediaTabs } from "./_components/segmented-tabs";
import { JournalistsPanel } from "./_components/journalists-panel";
import { PublicationsPanel } from "./_components/publications-panel";

export const dynamic = "force-dynamic";

const VERTICALS: Vertical[] = ["fnb", "hospitality", "real_estate", "d2c", "other"];
const EMAIL_STATUSES: EmailStatus[] = ["unverified", "pattern_guess", "verified", "bounced"];
const SORT_COLUMNS: JournalistSortColumn[] = ["name", "email_status", "last_profiled_at"];
const PAGE_SIZE = 25;

type SearchParams = Record<string, string | string[] | undefined>;

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const one = (key: string): string | undefined => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const tab = one("tab") === "publications" ? "publications" : "journalists";
  const vertical: Vertical | "all" = VERTICALS.includes(one("vertical") as Vertical)
    ? (one("vertical") as Vertical)
    : "all";
  const publicationId = one("publication") ?? "all";
  const emailStatus: EmailStatus | "all" = EMAIL_STATUSES.includes(one("email") as EmailStatus)
    ? (one("email") as EmailStatus)
    : "all";
  const search = one("q") ?? "";
  const sort: JournalistSortColumn = SORT_COLUMNS.includes(one("sort") as JournalistSortColumn)
    ? (one("sort") as JournalistSortColumn)
    : "name";
  const dir: "asc" | "desc" = one("dir") === "desc" ? "desc" : "asc";
  const page = Math.max(1, Number(one("page")) || 1);

  const [publications, counts] = await Promise.all([
    listPublications(),
    getJournalistCountsByPublication(),
  ]);
  const totalJournalists = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const verifierSandbox = providerIsMock("VERIFIER");

  const journalistsData =
    tab === "journalists"
      ? await listJournalistsWithPublication({
          vertical: vertical === "all" ? undefined : vertical,
          publicationId: publicationId === "all" ? undefined : publicationId,
          emailStatus: emailStatus === "all" ? undefined : emailStatus,
          search: search || undefined,
          sort,
          dir,
          page,
          pageSize: PAGE_SIZE,
        })
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Database"
        description="India-first journalists and publications, built and maintained in-house."
      >
        <AddPublicationButton />
      </PageHeader>

      <MediaTabs
        tab={tab}
        journalistsCount={totalJournalists}
        publicationsCount={publications.length}
      />

      {tab === "journalists" && journalistsData ? (
        <JournalistsPanel
          data={journalistsData}
          publications={publications}
          filters={{ vertical, publicationId, emailStatus, search, sort, dir }}
          verifierSandbox={verifierSandbox}
        />
      ) : (
        <PublicationsPanel initialPublications={publications} initialCounts={counts} />
      )}
    </div>
  );
}
