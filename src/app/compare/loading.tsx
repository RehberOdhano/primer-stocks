import { SkeletonBar, SkeletonTable } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <SkeletonBar className="h-8 w-32" />
        <SkeletonBar className="h-4 w-72" />
      </div>

      <div className="flex gap-3">
        <SkeletonBar className="h-9 w-28" />
        <SkeletonBar className="h-9 w-28" />
      </div>

      <SkeletonTable rows={5} />
    </main>
  );
}
