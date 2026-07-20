import { SkeletonBar, SkeletonTable } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <SkeletonBar className="h-8 w-32" />
        <SkeletonBar className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <SkeletonBar className="h-4 w-24" />
          <SkeletonBar className="mt-2 h-8 w-32" />
          <SkeletonBar className="mt-2 h-3 w-40" />
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <SkeletonBar className="h-4 w-24" />
          <SkeletonBar className="mt-2 h-8 w-32" />
          <SkeletonBar className="mt-2 h-3 w-40" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SkeletonBar className="h-6 w-40" />
        <div className="flex gap-3">
          <SkeletonBar className="h-14 w-32" />
          <SkeletonBar className="h-14 w-24" />
          <SkeletonBar className="h-14 w-24" />
          <SkeletonBar className="h-9 w-28 self-end" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SkeletonBar className="h-6 w-24" />
        <SkeletonTable rows={4} />
      </div>

      <div className="flex flex-col gap-3">
        <SkeletonBar className="h-6 w-32" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SkeletonBar className="h-32 w-full" />
          <SkeletonBar className="h-32 w-full" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SkeletonBar className="h-6 w-24" />
        <SkeletonTable rows={4} />
      </div>
    </main>
  );
}
