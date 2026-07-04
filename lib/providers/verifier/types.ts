/** Verifier maps to the email_status enum minus "unverified" (the pre-check state). */
export type VerifyResult = "verified" | "pattern_guess" | "bounced";

export interface VerifierProvider {
  verifyEmail(email: string): Promise<VerifyResult>;
}
