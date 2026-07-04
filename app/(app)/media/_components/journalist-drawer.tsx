"use client";

import * as React from "react";
import {
  BadgeCheck,
  ExternalLink,
  Loader2,
  Mail,
  Newspaper,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/app/status-pill";
import { SandboxBadge } from "@/components/app/sandbox-badge";
import { RelativeTime } from "@/components/app/relative-time";
import { EmptyState } from "@/components/app/empty-state";
import { ErrorState } from "@/components/app/error-state";
import { emailStatusMeta } from "@/lib/status";
import { tierLabel, verticalLabel } from "@/lib/format";
import type { Article, EmailStatus } from "@/lib/db/types";
import type { JournalistWithPublication } from "@/lib/db/journalists";
import { getJournalistArticlesAction } from "../actions";
import { ReceptivityFlags } from "./receptivity-flags";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  );
}

export function JournalistDrawer({
  journalist,
  open,
  onOpenChange,
  emailStatus,
  emailVerifiedAt,
  verifierSandbox,
  verifying,
  onVerify,
}: {
  journalist: JournalistWithPublication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailStatus: EmailStatus;
  emailVerifiedAt: string | null;
  verifierSandbox: boolean;
  verifying: boolean;
  onVerify: () => void;
}) {
  const [articles, setArticles] = React.useState<Article[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  const journalistId = journalist?.id ?? null;
  // Tracks the most recent request so a slower stale response cannot overwrite
  // the articles of a journalist selected afterwards.
  const requestIdRef = React.useRef<string | null>(null);

  const loadArticles = React.useCallback(() => {
    if (!journalistId) return;
    requestIdRef.current = journalistId;
    setLoading(true);
    setError(false);
    getJournalistArticlesAction(journalistId)
      .then((res) => {
        if (requestIdRef.current !== journalistId) return;
        setArticles(res.articles);
      })
      .catch(() => {
        if (requestIdRef.current !== journalistId) return;
        setError(true);
      })
      .finally(() => {
        if (requestIdRef.current === journalistId) setLoading(false);
      });
  }, [journalistId]);

  React.useEffect(() => {
    if (open && journalistId) {
      setArticles(null);
      loadArticles();
    }
  }, [open, journalistId, loadArticles]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        {journalist && (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="text-lg">{journalist.name}</SheetTitle>
              <SheetDescription asChild>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {journalist.role && <span>{journalist.role}</span>}
                  {journalist.role && <span aria-hidden>&middot;</span>}
                  <span>{journalist.publication.name}</span>
                  <StatusPill
                    hue="neutral"
                    label={verticalLabel(journalist.publication.vertical)}
                    hideDot
                  />
                  <StatusPill
                    hue="neutral"
                    label={tierLabel(journalist.publication.tier)}
                    hideDot
                    dim
                  />
                </div>
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-4 py-5">
              <Section title="Email">
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Mail className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm">
                        {journalist.email ?? "No email found"}
                      </span>
                    </div>
                    <StatusPill {...emailStatusMeta(emailStatus)} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {emailVerifiedAt ? (
                        <span className="flex items-center gap-1">
                          Verified <RelativeTime iso={emailVerifiedAt} />
                        </span>
                      ) : (
                        <span>Not yet verified</span>
                      )}
                      {verifierSandbox && <SandboxBadge />}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onVerify}
                      disabled={!journalist.email || verifying}
                    >
                      {verifying ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <BadgeCheck className="size-4" />
                      )}
                      Verify
                    </Button>
                  </div>
                </div>
              </Section>

              <Section title="Receptivity">
                <ReceptivityFlags
                  quotesFounders={journalist.quotes_founders}
                  usesDataStudies={journalist.uses_data_studies}
                />
                {journalist.receptivity_notes ? (
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {journalist.receptivity_notes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No receptivity notes yet.</p>
                )}
              </Section>

              <Section title="Beat">
                {journalist.beat_summary ? (
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {journalist.beat_summary}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No beat summary yet.</p>
                )}
              </Section>

              <Section title="Recent articles">
                {loading && (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                )}
                {!loading && error && (
                  <ErrorState
                    title="Could not load articles"
                    description="The article list failed to load."
                    retry={loadArticles}
                  />
                )}
                {!loading && !error && articles && articles.length === 0 && (
                  <EmptyState
                    icon={Newspaper}
                    title="No articles yet"
                    description="Articles appear after this journalist is profiled."
                  />
                )}
                {!loading && !error && articles && articles.length > 0 && (
                  <ul className="divide-y rounded-lg border">
                    {articles.map((article) => (
                      <li key={article.id}>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 px-3 py-2.5 transition-colors hover:bg-muted/40"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 text-sm font-medium">
                              <span className="truncate">{article.title}</span>
                              <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                            </span>
                            {article.summary && (
                              <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                                {article.summary}
                              </span>
                            )}
                          </span>
                          {article.published_at && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              <RelativeTime iso={article.published_at} />
                            </span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Profile">
                <p className="text-sm text-muted-foreground">
                  Last profiled <RelativeTime iso={journalist.last_profiled_at} />
                </p>
              </Section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
