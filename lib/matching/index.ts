/**
 * Matching engine. Ranks journalists for a story angle. The scoring lives here
 * (behind /lib/matching) so the implementation can swap: the primary path embeds
 * the story angle via the llm provider and cosine-matches profile + article
 * embeddings through the match_journalists RPC; the fallback is a weighted
 * keyword score for when embeddings are not available (docs/data-model.md).
 *
 * All external work goes through /lib/providers; nothing here knows the mode.
 */
import { llm } from "@/lib/providers";
import { getJournalistsByIds, matchJournalists } from "@/lib/db/journalists";
import { toVectorLiteral } from "@/lib/format";
import { buildRationale } from "./rationale";
import { keywordMatch } from "./keyword";
import type { MatchCandidate, MatchStoryInput, MatchStoryResult } from "./types";

export type { MatchCandidate, MatchMethod, MatchStoryInput, MatchStoryResult } from "./types";

export async function matchStory(input: MatchStoryInput): Promise<MatchStoryResult> {
  const storyAngle = input.storyAngle?.trim() ?? "";
  if (!storyAngle) return { method: "vector", candidates: [] };

  const matchCount = input.matchCount ?? 25;
  const vertical = input.vertical ?? null;

  // Primary: embedding path.
  try {
    const [vector] = await llm.embed([storyAngle]);
    if (vector && vector.length) {
      const matches = await matchJournalists({
        queryEmbedding: toVectorLiteral(vector),
        matchCount,
        filterVertical: vertical,
        minScore: input.minScore ?? 0,
        profileWeight: input.profileWeight ?? 0.6,
      });

      if (matches.length) {
        const journalists = await getJournalistsByIds(matches.map((m) => m.journalist_id));
        const byId = new Map(journalists.map((j) => [j.id, j]));
        const candidates = matches
          .map((m): MatchCandidate | null => {
            const journalist = byId.get(m.journalist_id);
            if (!journalist) return null;
            return {
              journalist,
              score: m.score,
              profileSimilarity: m.profile_similarity,
              articleSimilarity: m.article_similarity,
              rationale: buildRationale(journalist, {
                profileSimilarity: m.profile_similarity,
                articleSimilarity: m.article_similarity,
              }),
              method: "vector",
            };
          })
          .filter((c): c is MatchCandidate => c !== null);

        return { method: "vector", candidates };
      }
    }
  } catch {
    // Embeddings unavailable (no key, provider error): fall through to keyword.
  }

  // Fallback: keyword scoring.
  const candidates = await keywordMatch({ storyAngle, vertical, matchCount });
  return { method: "keyword", candidates };
}
