import { z } from "zod";

/**
 * Both accessors are lazy (called at point of use, not at module import
 * time). Next.js executes route/proxy modules during the build's page-data
 * collection step even for routes that won't run in that environment, so
 * top-level validation would fail the build whenever secrets aren't present
 * — e.g. in CI before env vars are configured.
 */
export function getPublicEnv() {
  const publicEnvSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  });

  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    throw new Error(`Invalid public environment variables: ${parsed.error.message}`);
  }

  return parsed.data;
}

/**
 * Server-only secrets. Importing this module from client code is a mistake;
 * `server-only` (see lib/supabase/admin.ts) makes that a build error rather
 * than a leaked secret.
 */
export function getServerEnv() {
  const serverEnvSchema = z.object({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    FINNHUB_API_KEY: z.string().min(1),
    CRON_SECRET: z.string().min(16),
  });

  const parsed = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    FINNHUB_API_KEY: process.env.FINNHUB_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
  });

  if (!parsed.success) {
    throw new Error(`Invalid server environment variables: ${parsed.error.message}`);
  }

  return parsed.data;
}
