"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Spinner } from "@/components/Spinner";
import { createClient } from "@/lib/supabase/client";

const INPUT_CLASS =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

const INVALID_LINK_MESSAGE = "This reset link is invalid or has expired.";

/**
 * Supabase's password-recovery email links carry the session as an implicit
 * grant — access/refresh tokens in the URL hash fragment, never sent to the
 * server. That means establishing the session has to happen client-side, by
 * reading window.location.hash after the page loads and calling setSession
 * with the browser client (which persists it to cookies the server can then
 * read on subsequent requests).
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "ready" | "invalid">("verifying");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    async function verify() {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken || !refreshToken) {
        setStatus("invalid");
        return;
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setStatus("invalid");
        return;
      }
      // Clear tokens from the address bar now that the session is set.
      window.history.replaceState(null, "", window.location.pathname);
      setStatus("ready");
    }

    void verify();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setPending(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/portfolio");
  }

  if (status === "invalid") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-red-600 dark:text-red-400">{INVALID_LINK_MESSAGE}</p>
        <Link href="/forgot-password" className="text-sm underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (status === "verifying") {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Verifying reset link…</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="password"
        name="password"
        placeholder="New password (min. 8 characters)"
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className={INPUT_CLASS}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending && <Spinner className="h-4 w-4" />}
        {pending ? "Updating…" : "Update password"}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
