import type { AiMentionStats, BacklinkStats, SeoDataProvider } from "./types";

// The only place in the app that talks to DataForSEO. Already subscribed.
// Backlinks come from the Backlinks API summary endpoint; AI mentions from the AI
// Optimization "LLM mentions" aggregation endpoint used for GEO reporting. Both
// are snapshotted into metrics_snapshots (docs/providers.md, Module 4).
const BASE = process.env.DATAFORSEO_API_URL ?? "https://api.dataforseo.com/v3";

// DataForSEO's LLM-mentions endpoints are per platform. We query each supported
// platform and record the count under a stable engine key, so the report gets a
// real per-engine breakdown (docs/data-model.md: ai_mentions_breakdown).
const AI_PLATFORMS: { platform: string; engine: string }[] = [
  { platform: "chat_gpt", engine: "chatgpt" },
  { platform: "google", engine: "google" },
];

/** Whether the DataForSEO credentials are present. Used to decide real vs mock. */
export function seoDataConfigured(): boolean {
  return Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

function authHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error(
      "DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required for seoData (real). See .env.example.",
    );
  }
  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
}

async function post<T>(path: string, task: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: authHeader() },
    // DataForSEO takes an array of tasks and returns an array of results.
    body: JSON.stringify([task]),
  });
  if (!res.ok) {
    throw new Error(`DataForSEO ${path} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

type DfsResult<T> = { tasks?: Array<{ result?: T[] | null }> };

/** A domain or subdomain for DataForSEO must be bare: no scheme, no www. */
function toTarget(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "");
}

/** Mentions live under different keys across LLM-mentions responses; read defensively. */
function readMentions(result: Record<string, unknown> | undefined): number {
  if (!result) return 0;
  const metrics = (result.metrics ?? result) as Record<string, unknown>;
  const value =
    metrics.mentions ?? metrics.mentions_count ?? metrics.count ?? result.mentions;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export const realSeoData: SeoDataProvider = {
  async getBacklinks(domain: string): Promise<BacklinkStats> {
    const data = await post<
      DfsResult<{ backlinks?: number; referring_domains?: number }>
    >("/backlinks/summary/live", {
      target: toTarget(domain),
      internal_list_limit: 1,
      include_subdomains: true,
      exclude_internal_backlinks: true,
    });
    const result = data.tasks?.[0]?.result?.[0];
    return {
      backlinksCount: result?.backlinks ?? 0,
      referringDomains: result?.referring_domains ?? 0,
    };
  },

  async getAiMentions(domain: string): Promise<AiMentionStats> {
    const target = toTarget(domain);
    const location = process.env.DATAFORSEO_LOCATION ?? "India";
    const language = process.env.DATAFORSEO_LANGUAGE ?? "en";

    // One call per platform; a platform that errors contributes zero rather than
    // failing the whole snapshot (a report with two engines still beats none).
    const perPlatform = await Promise.all(
      AI_PLATFORMS.map(async ({ platform, engine }) => {
        try {
          const data = await post<DfsResult<Record<string, unknown>>>(
            "/ai_optimization/llm_mentions/aggregation_metrics/live",
            {
              target: [{ domain: target }],
              platform,
              location_name: location,
              language_code: language,
            },
          );
          return { engine, count: readMentions(data.tasks?.[0]?.result?.[0] ?? undefined) };
        } catch {
          return { engine, count: 0 };
        }
      }),
    );

    const breakdown: Record<string, number> = {};
    let total = 0;
    for (const { engine, count } of perPlatform) {
      breakdown[engine] = (breakdown[engine] ?? 0) + count;
      total += count;
    }
    return { total, breakdown };
  },
};
