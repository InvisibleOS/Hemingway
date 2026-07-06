import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { isDemoMode, createDemoClient } from "./_demo/client";
import type { Database } from "./types";

export type Db = SupabaseClient<Database>;

/**
 * Default client for /lib/db functions: the service-role client (bypasses RLS).
 * Every query function accepts an optional client so callers can inject their
 * own, e.g. the seed script or an SSR anon client once auth lands.
 *
 * In demo mode (no database configured, or DEMO_MODE=1) it returns an in-memory
 * client backed by baked fixtures, so the app renders the full demo with no
 * Supabase, e.g. on a preview deployment. See lib/db/_demo/client.ts.
 */
export function getDb(): Db {
  if (isDemoMode()) return createDemoClient();
  return createServiceClient();
}
