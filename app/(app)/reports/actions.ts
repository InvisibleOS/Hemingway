"use server";

import { revalidatePath } from "next/cache";
import { getClient } from "@/lib/db";
import { snapshotClient } from "@/lib/reporting/snapshot";
import { seoDataSource } from "@/lib/providers";

/**
 * Take this month's metrics snapshot for the client on demand, pulling backlinks
 * + AI mentions through the seoData provider. Idempotent: mirrors the monthly
 * cron, and does nothing if the month is already recorded.
 */
export async function takeSnapshotAction(
  clientId: string,
): Promise<{ outcome: string; source: string }> {
  const client = await getClient(clientId);
  if (!client) throw new Error("Client not found");
  const outcome = await snapshotClient(client);
  revalidatePath("/reports");
  return { outcome, source: seoDataSource() };
}
