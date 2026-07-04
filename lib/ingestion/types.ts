/**
 * Ingestion job state. Persisted inside publications.scrape_config.ingestion
 * (jsonb, already in the schema) so progress survives refreshes and is readable
 * by the publications table without a separate jobs table. A production build
 * would move the runner behind a real queue (Upstash QStash, per docs/fsd.md);
 * the state shape stays the same.
 */
export type IngestionStatus = "idle" | "queued" | "running" | "complete" | "error";

export type IngestionState = {
  status: IngestionStatus;
  /** Human-readable phase for the row, e.g. "Reading author pages". */
  phase: string;
  /** Journalists processed so far. */
  processed: number;
  /** Journalists discovered to process. */
  total: number;
  journalistsFound: number;
  articlesFound: number;
  /** Non-fatal, per-journalist failures. The run continues past each. */
  errors: string[];
  mode: "add" | "refresh";
  startedAt?: string;
  finishedAt?: string;
};

export function isActiveIngestion(state: IngestionState | null | undefined): boolean {
  return state?.status === "queued" || state?.status === "running";
}

/**
 * Read the ingestion state out of a publication's scrape_config (jsonb). Pure and
 * dependency-free so both the server pipeline and client components can use it.
 */
export function readIngestionState(scrapeConfig: unknown): IngestionState | null {
  if (!scrapeConfig || typeof scrapeConfig !== "object" || Array.isArray(scrapeConfig)) {
    return null;
  }
  const ingestion = (scrapeConfig as Record<string, unknown>).ingestion;
  if (!ingestion || typeof ingestion !== "object") return null;
  return ingestion as IngestionState;
}
