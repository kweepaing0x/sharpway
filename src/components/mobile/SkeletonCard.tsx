interface SkeletonCardProps {
  variant?: 'taxi' | 'hotel' | 'product' | 'default';
  className?: string;
}

export function SkeletonCard({ variant = 'default', className = '' }: SkeletonCardProps) {
  if (variant === 'taxi') {
    return (
      <div
        className={`
          bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A]
          border border-[#2A2A2A] rounded-2xl p-4
          animate-pulse ${className}
        `}
      >
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>

          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-lg w-3/4 relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>

            <div className="h-4 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-lg w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>

            <div className="flex gap-2">
              <div className="h-6 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-full w-20 relative overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
              <div className="h-6 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-full w-16 relative overflow-hidden">
                <div className="absolute inset-0 shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'hotel') {
    return (
      <div
        className={`
          bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A]
          border border-[#2A2A2A] rounded-2xl overflow-hidden
          animate-pulse ${className}
        `}
      >
        <div className="w-full h-48 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] relative overflow-hidden">
          <div className="absolute inset-0 shimmer" />
        </div>

        <div className="p-4 space-y-3">
          <div className="h-6 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-lg w-3/4 relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>

          <div className="h-4 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-lg w-full relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>

          <div className="h-4 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-lg w-2/3 relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="h-5 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-lg w-24 relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
            <div className="h-8 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-full w-20 relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A]
        border border-[#2A2A2A] rounded-2xl p-4
        animate-pulse ${className}
      `}
    >
      <div className="space-y-3">
        <div className="h-5 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-lg w-3/4 relative overflow-hidden">
          <div className="absolute inset-0 shimmer" />
        </div>

        <div className="h-4 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-lg w-full relative overflow-hidden">
          <div className="absolute inset-0 shimmer" />
        </div>

        <div className="h-4 bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] rounded-lg w-5/6 relative overflow-hidden">
          <div className="absolute inset-0 shimmer" />
        </div>
      </div>
    </div>
  );
}
