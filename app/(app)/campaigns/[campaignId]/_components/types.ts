import type { EmailStatus } from "@/lib/db/types";
import type { MatchMethod } from "@/lib/matching";

/**
 * Trimmed match candidate for the wire. Deliberately omits the profile embedding
 * (a 1024-dim vector) so it never ships to the browser.
 */
export type CandidateView = {
  journalistId: string;
  name: string;
  role: string | null;
  email: string | null;
  emailStatus: EmailStatus;
  publicationName: string;
  beatSummary: string | null;
  quotesFounders: boolean;
  usesDataStudies: boolean;
  score: number;
  rationale: string;
  alreadyPitched: boolean;
};

export type FindMatchesResult = {
  method: MatchMethod;
  candidates: CandidateView[];
};

export type PitchSelection = {
  journalistId: string;
  matchScore: number;
};
