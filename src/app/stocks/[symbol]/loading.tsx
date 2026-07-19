import { SkeletonBar } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <SkeletonBar className="h-4 w-28" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <SkeletonBar className="h-8 w-24" />
          <SkeletonBar className="h-4 w-56" />
          <SkeletonBar className="h-4 w-20" />
        </div>
        <SkeletonBar className="h-9 w-20" />
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <SkeletonBar className="h-40 w-full" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <SkeletonBar className="h-4 w-16" />
            <SkeletonBar className="mt-2 h-6 w-20" />
          </div>
        ))}
      </div>
    </main>
  );
}
