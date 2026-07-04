import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

let cached: SupabaseClient<Database> | null = null;

/**
 * Server-only Supabase client using the service_role key. Bypasses RLS.
 *
 * This is how /lib/db and the seed script read and write until real auth exists
 * (see the "Data access" decision in the scaffold). Never import this from a
 * Client Component: the service role key must never reach the browser. A runtime
 * guard enforces that, and it avoids `import "server-only"` so the tsx seed
 * script can still use it.
 */
export function createServiceClient(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error("createServiceClient must not be called in the browser.");
  }
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. See .env.example.",
    );
  }

  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
