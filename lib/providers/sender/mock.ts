import { fnv1a } from "../_hash";
import type {
  PitchReply,
  PushPitchInput,
  PushPitchResult,
  SenderProvider,
} from "./types";

// pushPitch always succeeds and returns a deterministic external id. Replies are
// not invented here: the seed flips ~20% of pushed pitches to "replied" over
// time so the demo board looks alive (docs/providers.md). getReplies is the hook
// the real integration will poll; in mock mode it returns nothing new.
export const mockSender: SenderProvider = {
  async pushPitch(input: PushPitchInput): Promise<PushPitchResult> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { externalId: `sandbox_${fnv1a(input.pitchId).toString(16)}` };
  },

  async getReplies(): Promise<PitchReply[]> {
    return [];
  },
};
