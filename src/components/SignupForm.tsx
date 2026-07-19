"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Spinner } from "@/components/Spinner";
import { signupAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

const INPUT_CLASS =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

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
        placeholder="Password (min. 8 characters)"
        required
        minLength={8}
        autoComplete="new-password"
        className={INPUT_CLASS}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending && <Spinner className="h-4 w-4" />}
        {pending ? "Creating account…" : "Sign up"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state.message && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.message}</p>
      )}
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
