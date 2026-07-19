import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getPublicEnv, getServerEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role client. Bypasses RLS entirely — only for trusted server-side
 * jobs (price ingestion) that must write to tables users can't write to
 * directly (`tickers`, `price_snapshots`). Never use this to serve a
 * user-facing request.
 */
export function createAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  const env = getPublicEnv();

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
