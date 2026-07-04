import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "./types";

export type Db = SupabaseClient<Database>;

/**
 * Default client for /lib/db functions: the service-role client (bypasses RLS).
 * Every query function accepts an optional client so callers can inject their
 * own, e.g. the seed script or an SSR anon client once auth lands.
 */
export function getDb(): Db {
  return createServiceClient();
}
