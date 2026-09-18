export function Skeleton({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/[0.06] ${className}`}>
      <span
        aria-hidden="true"
        className="animate-shimmer absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/[0.09] to-transparent"
      />
    </div>
  );
}

export function SkeletonCard({ lines = 2, className = '' }) {
  return (
    <div className={`glass space-y-3 p-4 ${className}`}>
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={`h-4 ${index % 2 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

/* Column counts match the real grids in Wardrobe and RateSaved so the
   placeholder does not reflow into a different shape when data lands. */
export function SkeletonGrid({ count = 6, className = '' }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass overflow-hidden p-0">
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
