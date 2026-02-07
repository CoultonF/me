import Skeleton from './Skeleton';

interface CardSkeletonProps {
  count?: number;
  columns?: number;
}

export function CardsSkeleton({ count = 4, columns = 4 }: CardSkeletonProps) {
  const colClass =
    columns === 3 ? 'grid-cols-1 md:grid-cols-3' :
    columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
    'grid-cols-2 md:grid-cols-4';

  return (
    <div className={`grid ${colClass} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-tile border border-stroke rounded-lg p-4 space-y-3">
          <Skeleton height={12} width="60%" />
          <Skeleton height={28} width="40%" />
        </div>
      ))}
    </div>
  );
}

interface ChartSkeletonProps {
  height?: number;
  title?: boolean;
}

export function ChartSkeleton({ height = 300, title = true }: ChartSkeletonProps) {
  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      {title && <Skeleton height={12} width={120} className="mb-4" />}
      <Skeleton height={height} />
    </div>
  );
}
