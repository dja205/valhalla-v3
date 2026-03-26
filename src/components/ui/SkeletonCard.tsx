interface SkeletonCardProps {
  variant?: 'job' | 'stage' | 'agent';
}

export function SkeletonCard({ variant = 'job' }: SkeletonCardProps) {
  return (
    <div className="bg-bg-surface rounded-lg p-4 border border-bg-raised animate-pulse">
      {variant === 'job' && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-bg-raised" />
          <div className="flex-1">
            <div className="h-4 bg-bg-raised rounded w-32 mb-2" />
            <div className="h-3 bg-bg-raised rounded w-24" />
          </div>
          <div className="h-6 w-16 bg-bg-raised rounded" />
        </div>
      )}
      
      {variant === 'stage' && (
        <>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-bg-raised" />
              <div>
                <div className="h-4 bg-bg-raised rounded w-32 mb-2" />
                <div className="h-3 bg-bg-raised rounded w-24" />
              </div>
            </div>
            <div className="h-6 w-16 bg-bg-raised rounded" />
          </div>
        </>
      )}
      
      {variant === 'agent' && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-bg-raised" />
          <div className="h-4 bg-bg-raised rounded w-24" />
          <div className="h-3 bg-bg-raised rounded w-16" />
        </div>
      )}
    </div>
  );
}
