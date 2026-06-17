import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-2">
        <Skeleton className="h-24 w-[250px] shrink-0" />
        <Skeleton className="h-24 w-[250px] shrink-0" />
        <Skeleton className="h-24 w-[250px] shrink-0" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
           <Skeleton className="h-10 w-[200px]" />
           <Skeleton className="h-10 w-[300px]" />
        </div>
        <div className="border border-slate-200 rounded-xl p-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  )
}
