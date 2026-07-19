import { SkeletonBar, SkeletonTable } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-10">
      <div className="flex flex-col gap-2">
        <SkeletonBar className="h-8 w-32" />
        <SkeletonBar className="h-4 w-64" />
      </div>

      <div className="flex flex-col gap-3">
        <SkeletonBar className="h-6 w-24" />
        <SkeletonTable />
      </div>

      <div className="flex flex-col gap-3">
        <SkeletonBar className="h-6 w-48" />
        <SkeletonTable />
      </div>
    </main>
  );
}
