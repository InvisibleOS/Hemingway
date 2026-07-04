import { fnv1a } from "../_hash";
import type { VerifierProvider, VerifyResult } from "./types";

// Deterministic by email hash (docs/providers.md): ~85% verified, 10%
// pattern_guess, 5% bounced, with a 300ms artificial delay so the UI shows a
// realistic verification latency.
export const mockVerifier: VerifierProvider = {
  async verifyEmail(email: string): Promise<VerifyResult> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const bucket = fnv1a(email.trim().toLowerCase()) % 100;
    if (bucket < 85) return "verified";
    if (bucket < 95) return "pattern_guess";
    return "bounced";
  },
};
