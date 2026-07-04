import { NotImplementedError } from "../errors";
import type { SenderProvider } from "./types";

// Shell. To go live: Smartlead or Instantly API.
// - pushPitch: create/add the approved pitch to the client's campaign on the
//   sending platform; return the platform's message/lead id as externalId, then
//   set the pitch status to "pushed" and record pushed_at.
// - getReplies: poll the platform (or receive a webhook) for replies and map
//   them back to pitch status "replied" by externalId.
// Read credentials from SENDER_API_KEY.
export const realSender: SenderProvider = {
  async pushPitch() {
    throw new NotImplementedError(
      "sender real provider not implemented. Add SENDER_API_KEY and a Smartlead/Instantly integration.",
    );
  },
  async getReplies() {
    throw new NotImplementedError(
      "sender real provider not implemented. Add SENDER_API_KEY and a Smartlead/Instantly integration.",
    );
  },
};
