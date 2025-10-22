import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  illustration,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        py-16 px-6 text-center
        ${className}
      `}
    >
      {illustration && (
        <div className="mb-6 w-full max-w-xs opacity-60">{illustration}</div>
      )}

      {icon && (
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#2A2A2A]">
          {icon}
        </div>
      )}

      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>

      {description && (
        <p className="text-gray-400 text-sm max-w-md mb-6">{description}</p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
