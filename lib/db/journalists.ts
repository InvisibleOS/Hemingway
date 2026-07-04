import { getDb, type Db } from "./_client";
import type {
  EmailStatus,
  Journalist,
  JournalistInsert,
  JournalistMatch,
  PublicationTier,
  Vertical,
} from "./types";

export type JournalistFilters = {
  publicationId?: string;
  emailStatus?: EmailStatus;
  search?: string;
  limit?: number;
};

export async function listJournalists(
  filters: JournalistFilters = {},
  db: Db = getDb(),
): Promise<Journalist[]> {
  let query = db.from("journalists").select("*").order("name");
  if (filters.publicationId) query = query.eq("publication_id", filters.publicationId);
  if (filters.emailStatus) query = query.eq("email_status", filters.emailStatus);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);
  if (filters.limit) query = query.limit(filters.limit);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getJournalist(
  id: string,
  db: Db = getDb(),
): Promise<Journalist | null> {
  const { data, error } = await db
    .from("journalists")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function countJournalists(db: Db = getDb()): Promise<number> {
  const { count, error } = await db
    .from("journalists")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function insertJournalists(
  rows: JournalistInsert[],
  db: Db = getDb(),
): Promise<Journalist[]> {
  const { data, error } = await db.from("journalists").insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

export async function updateJournalist(
  id: string,
  patch: Partial<JournalistInsert>,
  db: Db = getDb(),
): Promise<Journalist | null> {
  const { data, error } = await db
    .from("journalists")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Journalist row with the parent publication embedded (name, vertical, tier). */
export type JournalistWithPublication = Journalist & {
  publication: {
    id: string;
    name: string;
    vertical: Vertical;
    tier: PublicationTier;
  };
};

export type JournalistSortColumn = "name" | "email_status" | "last_profiled_at";

export type JournalistListFilters = {
  vertical?: Vertical;
  publicationId?: string;
  emailStatus?: EmailStatus;
  search?: string;
  sort?: JournalistSortColumn;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type JournalistListPage = {
  rows: JournalistWithPublication[];
  total: number;
  page: number;
  pageSize: number;
};

const JOURNALIST_SELECT =
  "*, publication:publications!inner(id, name, vertical, tier)";

/**
 * Paginated, filterable, sortable journalist list with the parent publication
 * embedded. Vertical lives on publications, so it is filtered through the
 * embedded resource (an inner join). Returns the page plus the total count of
 * the filtered set for pagination.
 */
export async function listJournalistsWithPublication(
  filters: JournalistListFilters = {},
  db: Db = getDb(),
): Promise<JournalistListPage> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
  const ascending = filters.dir !== "desc";

  let query = db
    .from("journalists")
    .select(JOURNALIST_SELECT, { count: "exact" });

  if (filters.vertical) query = query.eq("publication.vertical", filters.vertical);
  if (filters.publicationId) query = query.eq("publication_id", filters.publicationId);
  if (filters.emailStatus) query = query.eq("email_status", filters.emailStatus);
  if (filters.search) {
    // Strip characters that would break PostgREST's or() grammar (commas separate
    // conditions, parentheses group, % is the ilike wildcard).
    const term = filters.search.replace(/[,()%\\]/g, " ").trim();
    if (term) {
      const pattern = `%${term}%`;
      query = query.or(`name.ilike.${pattern},beat_summary.ilike.${pattern}`);
    }
  }

  // Order on a real top-level column (embedded to-one columns cannot order the
  // parent rows in PostgREST), then add a stable id tiebreaker so range()
  // pagination cannot skip or duplicate rows when the sort column has ties
  // (email_status has only four distinct values across many rows).
  const column = filters.sort ?? "name";
  query = query
    .order(column, { ascending, nullsFirst: false })
    .order("id", { ascending: true });

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return {
    rows: (data ?? []) as unknown as JournalistWithPublication[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

/**
 * All journalists (with publication) in a vertical, unpaginated, for full-scan
 * fallbacks like keyword matching where an alphabetical page would truncate the
 * candidate set. Bounded by PostgREST's default row cap.
 */
export async function listAllJournalistsWithPublication(
  vertical?: Vertical,
  db: Db = getDb(),
): Promise<JournalistWithPublication[]> {
  let query = db.from("journalists").select(JOURNALIST_SELECT).order("name");
  if (vertical) query = query.eq("publication.vertical", vertical);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as JournalistWithPublication[];
}

/** Fetch journalists (with publication embedded) by id, e.g. to hydrate match results. */
export async function getJournalistsByIds(
  ids: string[],
  db: Db = getDb(),
): Promise<JournalistWithPublication[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db.from("journalists").select(JOURNALIST_SELECT).in("id", ids);
  if (error) throw error;
  return (data ?? []) as unknown as JournalistWithPublication[];
}

/** Map of publication_id -> journalist count, for the publications table. */
export async function getJournalistCountsByPublication(
  db: Db = getDb(),
): Promise<Record<string, number>> {
  const { data, error } = await db.from("journalists").select("publication_id");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.publication_id] = (counts[row.publication_id] ?? 0) + 1;
  }
  return counts;
}

/**
 * Embedding-path matching via the match_journalists RPC. The keyword fallback
 * lives in /lib/matching (added in a later session); this is the vector path.
 */
export async function matchJournalists(
  args: {
    queryEmbedding: string;
    matchCount?: number;
    filterVertical?: Vertical | null;
    minScore?: number;
    profileWeight?: number;
  },
  db: Db = getDb(),
): Promise<JournalistMatch[]> {
  const { data, error } = await db.rpc("match_journalists", {
    query_embedding: args.queryEmbedding,
    match_count: args.matchCount,
    filter_vertical: args.filterVertical ?? null,
    min_score: args.minScore,
    profile_weight: args.profileWeight,
  });
  if (error) throw error;
  return data ?? [];
}
