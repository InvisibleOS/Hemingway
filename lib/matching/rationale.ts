import type { JournalistWithPublication } from "@/lib/db/journalists";

/** First clause of a beat summary, capped, used as the rationale lead. */
function firstClause(text: string): string {
  const clause = text.split(/[.,;]/)[0]?.trim() ?? "";
  return clause.length > 48 ? `${clause.slice(0, 47).trimEnd()}...` : clause;
}

/**
 * A concise, deterministic "why matched" line built from the journalist profile
 * and the similarity signals. No LLM call, so it is instant and free per row.
 */
export function buildRationale(
  journalist: JournalistWithPublication,
  sims: { profileSimilarity: number | null; articleSimilarity: number | null },
): string {
  const parts: string[] = [];

  if (journalist.beat_summary) parts.push(firstClause(journalist.beat_summary));
  else parts.push("Profile fits the angle");

  const { profileSimilarity, articleSimilarity } = sims;
  if (articleSimilarity != null && profileSimilarity != null && articleSimilarity >= profileSimilarity) {
    parts.push("recent articles align");
  } else if (profileSimilarity != null) {
    parts.push("profile matches the angle");
  }

  if (journalist.uses_data_studies) parts.push("responds to data studies");
  else if (journalist.quotes_founders) parts.push("quotes founders");

  const line = parts.join("; ");
  return `${line.charAt(0).toUpperCase()}${line.slice(1)}.`;
}
