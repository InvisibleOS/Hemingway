import { NotImplementedError } from "../errors";
import type { VerifierProvider } from "./types";

// Shell. To go live: any pay-as-you-go verifier (ZeroBounce / NeverBounce class).
// One POST per address to the vendor's verify endpoint, then map the vendor
// result to the email_status enum:
//   valid            -> "verified"
//   catch-all/unknown -> "pattern_guess"
//   invalid           -> "bounced"
// Read the key from VERIFIER_API_KEY. Never verify an address twice; store the
// result and email_verified_at on the journalist row.
export const realVerifier: VerifierProvider = {
  async verifyEmail() {
    throw new NotImplementedError(
      "verifier real provider not implemented. Add VERIFIER_API_KEY and a ZeroBounce/NeverBounce integration.",
    );
  },
};
