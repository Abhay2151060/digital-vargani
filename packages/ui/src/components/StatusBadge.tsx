import React from 'react';
import { cn } from '../utils';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Info } from 'lucide-react';

export type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatusBadgeProps {
  status: BadgeStatus;
  label: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className,
  size = 'md',
}) => {
  const statusConfig = {
    success: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      icon: CheckCircle2,
    },
    warning: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
      icon: Clock,
    },
    error: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200/80',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-sky-50 text-sky-800 border-sky-200/80',
      icon: Info,
    },
    neutral: {
      bg: 'bg-[#F3F1EC] text-[#6B6459] border-[#E5E1D8]',
      icon: XCircle,
    },
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium tracking-wide select-none',
        config.bg,
        sizeStyles[size],
        className
      )}
    >
      <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
};
