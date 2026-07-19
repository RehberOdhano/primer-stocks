export function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 ${className}`} />
  );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="h-10 animate-pulse bg-zinc-100 dark:bg-zinc-900" />
      <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <SkeletonBar className="h-4 w-16" />
            <SkeletonBar className="h-4 w-32" />
            <SkeletonBar className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
