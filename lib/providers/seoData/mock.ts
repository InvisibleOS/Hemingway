import { fnv1a, mulberry32 } from "../_hash";
import type { AiMentionStats, BacklinkStats, SeoDataProvider } from "./types";

const ENGINES = ["chatgpt", "perplexity", "gemini", "claude"];

export const mockSeoData: SeoDataProvider = {
  async getBacklinks(domain: string): Promise<BacklinkStats> {
    const rand = mulberry32(fnv1a(domain));
    const referringDomains = 40 + Math.floor(rand() * 300);
    return {
      referringDomains,
      backlinksCount: referringDomains * (3 + Math.floor(rand() * 6)),
    };
  },

  async getAiMentions(domain: string): Promise<AiMentionStats> {
    const rand = mulberry32(fnv1a(`${domain}:ai`));
    const breakdown: Record<string, number> = {};
    let total = 0;
    for (const engine of ENGINES) {
      const n = Math.floor(rand() * 30);
      breakdown[engine] = n;
      total += n;
    }
    return { total, breakdown };
  },
};
