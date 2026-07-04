/**
 * Media ingestion pipeline. Given a publication, it maps the site, scrapes
 * author pages and recent articles, classifies each journalist, embeds profiles
 * and articles, and verifies pattern-guessed emails. It runs as a background job
 * (fire-and-forget from a server action) and streams progress into
 * publications.scrape_config.ingestion so the publications table can show it.
 *
 * Every external call goes through /lib/providers; this file never touches an
 * SDK or knows whether a provider is mock or real (CLAUDE.md, the provider rule).
 *
 * Failure policy: the run continues past any per-journalist error, recording it
 * in `errors`. A journalist with no findable email is stored as `unverified`,
 * never dropped.
 */
import { scraper, llm, verifier, type ScrapedArticle } from "@/lib/providers";
import {
  deleteArticlesByJournalist,
  getPublication,
  insertArticles,
  insertJournalists,
  listJournalists,
  updateJournalist,
  updatePublication,
  type EmailStatus,
  type Journalist,
  type Json,
  type Publication,
} from "@/lib/db";
import { hostname, normalizeUrl, toVectorLiteral } from "@/lib/format";
import type { IngestionState } from "./types";

// Live-mode work is bounded so a single ingest stays fast and cheap. A real
// scheduled re-scrape (docs/fsd.md) would lift these behind a queue.
const MAX_AUTHORS = 12;
const MAX_ARTICLES_PER_JOURNALIST = 8;
const ARTICLE_SCRAPE_CONCURRENCY = 4;

const AUTHOR_URL_PATTERN =
  /\/(author|authors|writer|writers|journalist|contributor|contributors|team|people|staff|profile)s?\//i;

// Guards against starting a second run for the same publication in this process.
const inFlight = new Set<string>();

/**
 * Kick off ingestion without blocking the caller (the server action returns
 * immediately). This fire-and-forget runs to completion in a long-lived process
 * (local dev, a persistent Node server). On a serverless host the instance may be
 * frozen once the response returns, so production should hand the job to a durable
 * queue (Upstash QStash, per docs/fsd.md) that calls runIngestion in a worker. The
 * job state contract (publications.scrape_config.ingestion) stays identical either
 * way, so only this entrypoint changes.
 */
export function startIngestion(publicationId: string, mode: "add" | "refresh" = "add"): void {
  if (inFlight.has(publicationId)) return;
  inFlight.add(publicationId);
  void runIngestion(publicationId, mode).finally(() => inFlight.delete(publicationId));
}

export async function runIngestion(
  publicationId: string,
  mode: "add" | "refresh" = "add",
): Promise<void> {
  const pub = await getPublication(publicationId);
  if (!pub) return;

  const baseConfig = readBaseConfig(pub);
  const state: IngestionState = {
    status: "running",
    phase: "Mapping site",
    processed: 0,
    total: 0,
    journalistsFound: 0,
    articlesFound: 0,
    errors: [],
    mode,
    startedAt: new Date().toISOString(),
  };

  const persist = async (extra?: Record<string, unknown>) => {
    await updatePublication(publicationId, {
      ...extra,
      scrape_config: { ...baseConfig, ingestion: state } as unknown as Json,
    });
  };

  await persist();

  try {
    const site = await scraper.mapSite(normalizeUrl(pub.website));
    const authorUrls = selectAuthorUrls(site.urls);
    state.total = authorUrls.length;
    state.phase = authorUrls.length ? "Reading author pages" : "No author pages found";
    await persist();

    const existingByName = new Map<string, Journalist>();
    if (mode === "refresh") {
      const existing = await listJournalists({ publicationId });
      for (const j of existing) existingByName.set(normalizeName(j.name), j);
    }

    const host = hostname(pub.website);

    for (const url of authorUrls) {
      try {
        await ingestAuthor({ url, pub, host, existingByName, state });
      } catch (err) {
        // Author-page level failure: log and move on, never abort the run.
        state.errors.push(`${shortUrl(url)}: ${errorMessage(err)}`);
      }
      state.processed += 1;
      state.phase = `Profiling ${state.processed} of ${state.total}`;
      await persist();
    }

    state.status = "complete";
    state.phase = state.errors.length
      ? `Complete with ${state.errors.length} skipped`
      : "Complete";
    state.finishedAt = new Date().toISOString();
    await persist({ last_scraped_at: new Date().toISOString() });
  } catch (err) {
    state.status = "error";
    state.phase = `Failed: ${errorMessage(err)}`;
    state.finishedAt = new Date().toISOString();
    await persist();
  }
}

type IngestAuthorArgs = {
  url: string;
  pub: Publication;
  host: string;
  existingByName: Map<string, Journalist>;
  state: IngestionState;
};

async function ingestAuthor({ url, pub, host, existingByName, state }: IngestAuthorArgs): Promise<void> {
  const author = await scraper.scrapeAuthorPage(url);
  const name = author.name?.trim();
  if (!name) return;

  const articleUrls = author.articleUrls.slice(0, MAX_ARTICLES_PER_JOURNALIST);
  const scraped = await mapWithConcurrency(articleUrls, ARTICLE_SCRAPE_CONCURRENCY, async (u) => {
    try {
      return await scraper.scrapeArticle(u);
    } catch {
      return null;
    }
  });
  const articles = scraped.filter((a): a is ScrapedArticle => a !== null);

  let classification: Awaited<ReturnType<typeof llm.classifyJournalist>> | null = null;
  try {
    classification = await llm.classifyJournalist({
      name,
      role: author.role,
      publication: pub.name,
      articles: articles.map((a) => ({ title: a.title, summary: a.summary })),
    });
  } catch (err) {
    state.errors.push(`classify ${name}: ${errorMessage(err)}`);
  }

  const profileText = [
    name,
    author.role,
    classification?.beatSummary,
    classification?.receptivityNotes,
    articles.map((a) => a.title).join(". "),
  ]
    .filter(Boolean)
    .join(". ");
  const articleTexts = articles.map((a) => [a.title, a.summary].filter(Boolean).join(". "));

  let profileEmbedding: string | null = null;
  let articleEmbeddings: number[][] = [];
  try {
    const vectors = await llm.embed([profileText, ...articleTexts]);
    profileEmbedding = vectors[0] ? toVectorLiteral(vectors[0]) : null;
    articleEmbeddings = vectors.slice(1);
  } catch (err) {
    state.errors.push(`embed ${name}: ${errorMessage(err)}`);
  }

  const email = author.email?.trim().toLowerCase() || inferEmail(name, host);
  let emailStatus: EmailStatus = "unverified";
  let emailVerifiedAt: string | null = null;
  if (email) {
    emailStatus = "pattern_guess";
    try {
      emailStatus = await verifier.verifyEmail(email);
      emailVerifiedAt = new Date().toISOString();
    } catch {
      // Verifier unavailable: keep the guessed address as pattern_guess.
    }
  }

  const now = new Date().toISOString();
  const record = {
    publication_id: pub.id,
    name,
    role: author.role ?? null,
    email: email ?? null,
    email_status: emailStatus,
    email_verified_at: emailVerifiedAt,
    beat_summary: classification?.beatSummary ?? null,
    receptivity_notes: classification?.receptivityNotes ?? null,
    quotes_founders: classification?.quotesFounders ?? false,
    uses_data_studies: classification?.usesDataStudies ?? false,
    profile_embedding: profileEmbedding,
    last_profiled_at: now,
  };

  const existing = existingByName.get(normalizeName(name));
  let journalistId: string;
  if (existing) {
    await updateJournalist(existing.id, record);
    journalistId = existing.id;
  } else {
    const [inserted] = await insertJournalists([record]);
    journalistId = inserted.id;
  }

  // Replace stored articles only when this run actually scraped some. A transient
  // scrape that returns nothing must never wipe a journalist's existing articles.
  if (articles.length) {
    if (existing) await deleteArticlesByJournalist(journalistId);
    await insertArticles(
      articles.map((a, i) => ({
        journalist_id: journalistId,
        title: a.title,
        url: a.url,
        published_at: a.publishedAt ?? null,
        summary: a.summary ?? null,
        embedding: articleEmbeddings[i] ? toVectorLiteral(articleEmbeddings[i]) : null,
      })),
    );
  }

  state.journalistsFound += 1;
  state.articlesFound += articles.length;
}

/** Prefer author-like URLs; fall back to the first mapped URLs so real sites still ingest. */
function selectAuthorUrls(urls: string[]): string[] {
  const unique = Array.from(new Set(urls));
  const authorLike = unique.filter((u) => AUTHOR_URL_PATTERN.test(u));
  const chosen = authorLike.length ? authorLike : unique;
  return chosen.slice(0, MAX_AUTHORS);
}

function inferEmail(name: string, host: string): string | undefined {
  if (!host || !host.includes(".")) return undefined;
  const clean = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/g, "");
  const parts = name.trim().split(/\s+/);
  const first = clean(parts[0] ?? "");
  const last = clean(parts.length > 1 ? parts[parts.length - 1] : "");
  if (!first) return undefined;
  return last ? `${first}.${last}@${host}` : `${first}@${host}`;
}

function readBaseConfig(pub: Publication): Record<string, unknown> {
  const cfg = pub.scrape_config;
  if (cfg && typeof cfg === "object" && !Array.isArray(cfg)) {
    const { ...rest } = cfg as Record<string, unknown>;
    delete rest.ingestion;
    return rest;
  }
  return {};
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function shortUrl(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}
