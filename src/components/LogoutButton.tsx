"use client";

import { useFormStatus } from "react-dom";

import { Spinner } from "@/components/Spinner";

/**
 * The logout <form> uses a plain Server Action (no return value to react
 * to), so there's no useActionState here — useFormStatus reads pending
 * state from the nearest ancestor <form> instead. Must be a child of that
 * form, which is why this is its own component rather than inline markup.
 */
export function LogoutButton({ className = "" }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 disabled:opacity-50 ${className}`}
    >
      {pending && <Spinner className="h-3.5 w-3.5" />}
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}
