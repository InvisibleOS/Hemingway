"use server";

import { cookies } from "next/headers";
import { ACTIVE_CLIENT_COOKIE } from "./constants";

/** Persist the operator's active client selection (used by client-scoped modules). */
export async function setActiveClient(clientId: string): Promise<void> {
  const store = await cookies();
  store.set(ACTIVE_CLIENT_COOKIE, clientId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
