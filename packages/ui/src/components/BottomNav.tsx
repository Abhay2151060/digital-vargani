import React from 'react';
import { cn } from '../utils';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: number | string;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  activeId: string;
  onSelect: (id: string, href?: string) => void;
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  items,
  activeId,
  onSelect,
  className,
}) => {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-[#E5E1D8]/80 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]',
        'safe-area-bottom select-none',
        className
      )}
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id, item.href)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center h-full py-1 gap-1 transition-all duration-150 min-h-[48px] touch-manipulation cursor-pointer',
                isActive
                  ? 'text-[#C2410C] font-bold'
                  : 'text-[#6B6459] hover:text-[#292118]'
              )}
            >
              <div className="relative">
                <div className={cn(
                  'p-1 rounded-xl transition-colors',
                  isActive ? 'bg-orange-50 text-[#C2410C]' : ''
                )}>
                  <Icon className={cn('w-5 h-5 transition-transform duration-150', isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]')} />
                </div>
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] leading-none tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
