import React from 'react';
import { cn } from '../utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none min-h-[44px] touch-manipulation select-none cursor-pointer';

  const variantStyles = {
    primary: 'bg-gradient-to-r from-[#C2410C] via-[#EA580C] to-[#F97316] text-white hover:from-[#9A3412] hover:to-[#C2410C] shadow-sm shadow-orange-500/25 active:bg-[#9A3412] border border-orange-600/30',
    secondary: 'bg-[#7C2D12] text-white hover:bg-[#5C220E] shadow-sm active:bg-[#451A0B] border border-[#5C220E]',
    outline: 'border border-[#E5E1D8] text-[#292118] bg-white hover:bg-[#FAF9F6] hover:border-[#D6D0C4] active:bg-[#F3F1EC] shadow-2xs',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:bg-red-800 border border-red-700',
    ghost: 'text-[#6B6459] hover:bg-[#F3F1EC] hover:text-[#292118]',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 h-9 rounded-lg',
    md: 'text-sm px-4 py-2 h-11 rounded-xl',
    lg: 'text-base px-6 py-3 h-13 rounded-xl font-semibold',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
