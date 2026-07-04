export type BacklinkStats = {
  backlinksCount: number;
  referringDomains: number;
};

export type AiMentionStats = {
  total: number;
  /** Per-engine mention counts, e.g. { chatgpt: 12, perplexity: 5, gemini: 3 }. */
  breakdown: Record<string, number>;
};

export interface SeoDataProvider {
  getBacklinks(domain: string): Promise<BacklinkStats>;
  getAiMentions(domain: string): Promise<AiMentionStats>;
}
