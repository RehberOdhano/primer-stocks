"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Spinner } from "@/components/Spinner";
import { loginAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

const INPUT_CLASS =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        type="email"
        name="email"
        placeholder="Email"
        required
        autoComplete="email"
        className={INPUT_CLASS}
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        autoComplete="current-password"
        className={INPUT_CLASS}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending && <Spinner className="h-4 w-4" />}
        {pending ? "Logging in…" : "Log in"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/forgot-password" className="underline">
          Forgot password?
        </Link>
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
