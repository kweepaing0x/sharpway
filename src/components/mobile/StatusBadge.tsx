interface StatusBadgeProps {
  status: 'available' | 'busy' | 'offline' | 'limited';
  children?: React.ReactNode;
  className?: string;
  showGlow?: boolean;
  pulse?: boolean;
}

export function StatusBadge({
  status,
  children,
  className = '',
  showGlow = true,
  pulse = true,
}: StatusBadgeProps) {
  const statusConfig = {
    available: {
      bg: 'bg-[#10B981]/20',
      text: 'text-[#10B981]',
      border: 'border-[#10B981]/40',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.5)]',
      label: 'Available',
    },
    busy: {
      bg: 'bg-[#FF6B35]/20',
      text: 'text-[#FF6B35]',
      border: 'border-[#FF6B35]/40',
      glow: 'shadow-[0_0_20px_rgba(255,107,53,0.5)]',
      label: 'Busy',
    },
    offline: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      border: 'border-gray-500/40',
      glow: '',
      label: 'Offline',
    },
    limited: {
      bg: 'bg-[#F59E0B]/20',
      text: 'text-[#F59E0B]',
      border: 'border-[#F59E0B]/40',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]',
      label: 'Limited',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        ${config.bg} ${config.text} ${config.border} border
        ${showGlow && status !== 'offline' ? config.glow : ''}
        backdrop-blur-xl transition-all duration-300
        ${className}
      `}
    >
      <span
        className={`
          w-2 h-2 rounded-full ${config.text.replace('text-', 'bg-')}
          ${pulse && status !== 'offline' ? 'animate-pulse' : ''}
        `}
      />
      <span className="text-sm font-medium">{children || config.label}</span>
    </div>
  );
}
