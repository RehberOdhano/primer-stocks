import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getPublicEnv } from "@/lib/env";

const PROTECTED_PATH_PREFIXES = ["/portfolio"];

/**
 * Refreshes the Supabase auth session cookie on every request (required by
 * @supabase/ssr so server components see an up-to-date session — see
 * https://supabase.com/docs/guides/auth/server-side/nextjs) and redirects
 * unauthenticated requests to protected paths.
 *
 * The redirect specifically has to happen here, not in a layout/page
 * `redirect()` call. Any route with a `loading.tsx` ancestor (including the
 * root `app/loading.tsx`, which wraps the entire tree) renders inside a
 * Suspense boundary; once that boundary starts streaming a 200 response,
 * a `redirect()` deeper in the tree can no longer change the HTTP status —
 * it degrades to a client-side-only NEXT_REDIRECT instruction in the
 * stream, which works in a real browser but isn't a real HTTP redirect.
 * Proxy runs before any of that rendering begins, so it's the only place
 * this is guaranteed to produce a real 307.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getPublicEnv();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Touching getUser() is what actually triggers the token refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PATH_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
