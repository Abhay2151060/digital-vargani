import React from 'react';
import { cn } from '../utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(41,33,24,0.05)] border border-[#E5E1D8]/80 hover:border-[#D6D0C4] transition-colors',
    flat: 'bg-[#F3F1EC]/80 rounded-2xl border border-[#E5E1D8]/50',
    bordered: 'bg-white rounded-2xl border border-[#E5E1D8] shadow-xs',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={cn(
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
