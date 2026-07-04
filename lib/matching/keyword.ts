import {
  listAllJournalistsWithPublication,
  type JournalistWithPublication,
} from "@/lib/db/journalists";
import type { Vertical } from "@/lib/db/types";
import { buildRationale } from "./rationale";
import type { MatchCandidate } from "./types";

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "over", "under",
  "our", "their", "your", "its", "are", "was", "were", "has", "have", "had",
  "will", "would", "can", "could", "one", "two", "how", "who", "what", "why",
  "new", "data", "study", "story", "angle", "about", "across", "between",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Weighted keyword score: fraction of the story's distinctive tokens that appear
 * in the journalist's profile text. This is the documented fallback for when
 * embeddings are not available (docs/data-model.md "Matching").
 */
export async function keywordMatch(input: {
  storyAngle: string;
  vertical: Vertical | null;
  matchCount: number;
}): Promise<MatchCandidate[]> {
  const storyTokens = new Set(tokenize(input.storyAngle));
  if (storyTokens.size === 0) return [];

  // Score the whole candidate set, not just an alphabetical page.
  const rows = await listAllJournalistsWithPublication(input.vertical ?? undefined);

  const scored = rows
    .map((journalist: JournalistWithPublication) => {
      const profileText = [
        journalist.beat_summary,
        journalist.receptivity_notes,
        journalist.role,
        journalist.publication.name,
      ]
        .filter(Boolean)
        .join(" ");
      const journalistTokens = new Set(tokenize(profileText));
      let overlap = 0;
      for (const token of storyTokens) if (journalistTokens.has(token)) overlap += 1;
      const score = overlap / storyTokens.size;
      return { journalist, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.matchCount);

  return scored.map((c) => ({
    journalist: c.journalist,
    score: c.score,
    profileSimilarity: c.score,
    articleSimilarity: null,
    rationale: buildRationale(c.journalist, {
      profileSimilarity: c.score,
      articleSimilarity: null,
    }),
    method: "keyword" as const,
  }));
}
