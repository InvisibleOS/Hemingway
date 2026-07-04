import type { AiMentionStats, BacklinkStats, SeoDataProvider } from "./types";

// The only place in the app that talks to DataForSEO. Already subscribed.
// Backlinks come from the backlinks summary endpoint; AI mentions from the LLM
// mentions endpoints already used for GEO reporting. Snapshot into
// metrics_snapshots (docs/providers.md).
const BASE = process.env.DATAFORSEO_API_URL ?? "https://api.dataforseo.com/v3";

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
    body: JSON.stringify([task]),
  });
  if (!res.ok) {
    throw new Error(`DataForSEO ${path} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

type DfsResult<T> = { tasks?: Array<{ result?: T[] }> };

export const realSeoData: SeoDataProvider = {
  async getBacklinks(domain: string): Promise<BacklinkStats> {
    const data = await post<
      DfsResult<{ backlinks?: number; referring_domains?: number }>
    >("/backlinks/summary/live", { target: domain });
    const result = data.tasks?.[0]?.result?.[0];
    return {
      backlinksCount: result?.backlinks ?? 0,
      referringDomains: result?.referring_domains ?? 0,
    };
  },

  async getAiMentions(domain: string): Promise<AiMentionStats> {
    // Aggregate LLM-mention metrics per engine for the domain.
    // TODO: map to the exact ai_optimization/llm_mentions aggregation task shape
    // once the reporting query is finalized in Module 4.
    const data = await post<
      DfsResult<{ items?: Array<{ engine?: string; mentions?: number }> }>
    >("/ai_optimization/llm_mentions/aggregation/live", { target: domain });
    const items = data.tasks?.[0]?.result?.[0]?.items ?? [];
    const breakdown: Record<string, number> = {};
    let total = 0;
    for (const item of items) {
      const engine = item.engine ?? "unknown";
      const n = item.mentions ?? 0;
      breakdown[engine] = (breakdown[engine] ?? 0) + n;
      total += n;
    }
    return { total, breakdown };
  },
};
