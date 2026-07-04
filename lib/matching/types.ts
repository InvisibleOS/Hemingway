import type { Vertical } from "@/lib/db/types";
import type { JournalistWithPublication } from "@/lib/db/journalists";

/** Which scoring path produced a result. Vector is primary; keyword is the fallback. */
export type MatchMethod = "vector" | "keyword";

export type MatchCandidate = {
  journalist: JournalistWithPublication;
  /** Blended 0..1 match score (cosine similarity for the vector path). */
  score: number;
  profileSimilarity: number | null;
  articleSimilarity: number | null;
  /** One-line, human-readable reason this journalist ranked. */
  rationale: string;
  method: MatchMethod;
};

export type MatchStoryInput = {
  storyAngle: string;
  vertical?: Vertical | null;
  matchCount?: number;
  minScore?: number;
  profileWeight?: number;
};

export type MatchStoryResult = {
  method: MatchMethod;
  candidates: MatchCandidate[];
};
