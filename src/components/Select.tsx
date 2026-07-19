import type { SelectHTMLAttributes } from "react";

/**
 * Wraps <select> with appearance:none + a custom chevron. Left unstyled,
 * the native dropdown arrow doesn't pick up our border/padding/dark-mode
 * styling and looks bolted-on rather than part of the design.
 */
export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative inline-block">
      <select
        {...props}
        className={`appearance-none rounded-md border border-zinc-300 bg-white py-1.5 pl-2 pr-7 text-sm dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
      >
        <path
          d="M6 8l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
