import type {
  AuthorPage,
  MappedSite,
  ScrapedArticle,
  ScraperProvider,
} from "./types";

// Firecrawl v2 REST (docs/providers.md: "Use v2 endpoints"). Already subscribed.
// This is the only place in the app that talks to Firecrawl.
const BASE = process.env.FIRECRAWL_API_URL ?? "https://api.firecrawl.dev/v2";

function apiKey(): string {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) {
    throw new Error("FIRECRAWL_API_KEY is required for scraper (real). See .env.example.");
  }
  return key;
}

async function firecrawl<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Firecrawl ${path} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export const realScraper: ScraperProvider = {
  async mapSite(url) {
    // POST /v2/map -> { links: [{ url }] | string[] }
    const data = await firecrawl<{ links?: Array<string | { url: string }> }>("/map", {
      url,
    });
    const urls = (data.links ?? []).map((l) => (typeof l === "string" ? l : l.url));
    return { urls } satisfies MappedSite;
  },

  async scrapeAuthorPage(url) {
    // Scrape the author page and return discovered article links. Structured
    // extraction of name/role/email is the Module 1 ingestion step (Session 2);
    // here we return the raw links plus a best-effort name from the metadata.
    const data = await firecrawl<{
      data?: {
        links?: string[];
        metadata?: { title?: string; author?: string };
      };
    }>("/scrape", { url, formats: ["markdown", "links"] });
    const meta = data.data?.metadata;
    return {
      name: meta?.author ?? meta?.title ?? url,
      profileUrl: url,
      articleUrls: data.data?.links ?? [],
    } satisfies AuthorPage;
  },

  async scrapeArticle(url) {
    const data = await firecrawl<{
      data?: {
        markdown?: string;
        metadata?: { title?: string; publishedTime?: string };
      };
    }>("/scrape", { url, formats: ["markdown"] });
    const meta = data.data?.metadata;
    return {
      title: meta?.title ?? url,
      url,
      publishedAt: meta?.publishedTime,
      content: data.data?.markdown ?? "",
    } satisfies ScrapedArticle;
  },
};
