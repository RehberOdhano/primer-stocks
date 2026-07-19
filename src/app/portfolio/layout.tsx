import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * The auth gate lives here rather than in page.tsx specifically because
 * loading.tsx wraps page.tsx in a Suspense boundary — a redirect() called
 * inside that boundary can't become a real HTTP redirect once streaming has
 * already committed to a 200 response; it degrades to a client-side-only
 * NEXT_REDIRECT instruction in the stream. A layout's own body executes
 * outside that boundary (it only wraps `children`), so redirecting here
 * still produces a proper HTTP 307 for the initial request.
 */
export default async function PortfolioLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <>{children}</>;
}
