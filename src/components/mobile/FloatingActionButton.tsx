import React from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  color?: 'cyan' | 'purple' | 'orange' | 'green';
  badge?: number;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  color = 'cyan',
  badge
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-20 right-4 md:bottom-6 md:right-6',
    'bottom-left': 'bottom-20 left-4 md:bottom-6 md:left-6',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4'
  };

  const colorClasses = {
    cyan: 'bg-accent-cyan hover:bg-accent-cyan/90 glow-cyan',
    purple: 'bg-accent-purple hover:bg-accent-purple/90 glow-purple',
    orange: 'bg-accent-orange hover:bg-accent-orange/90 glow-orange',
    green: 'bg-accent-green hover:bg-accent-green/90 glow-green'
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positionClasses[position]}
        w-14 h-14 rounded-full
        ${colorClasses[color]}
        text-white shadow-lg
        flex items-center justify-center
        transition-all duration-300
        hover:scale-110 active:scale-95
        z-40 group
      `}
      aria-label={label}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <span className="absolute right-full mr-3 px-3 py-1 bg-theme-card border border-theme rounded-lg text-sm font-medium text-theme-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
        {label}
      </span>
    </button>
  );
};

export default FloatingActionButton;
