import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Skeleton */}
      <div className="h-16 border-b flex items-center justify-between px-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Hero Skeleton */}
      <div className="py-20 px-6 max-w-6xl mx-auto space-y-8">
        <div className="space-y-4 flex flex-col items-center">
          <Skeleton className="h-12 w-[80%] max-w-2xl" />
          <Skeleton className="h-12 w-[60%] max-w-xl" />
        </div>
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-6 w-[40%] max-w-lg" />
          <Skeleton className="h-12 w-48 rounded-full" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-[40px]" />
      </div>

      {/* Product Grid Skeleton */}
      <div className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-3xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-6 w-[40%]" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
