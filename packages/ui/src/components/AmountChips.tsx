import React from 'react';
import { cn } from '../utils';

export interface AmountChipsProps {
  amounts?: number[];
  selectedAmount?: number | null;
  onSelect: (amount: number) => void;
  className?: string;
}

export const AmountChips: React.FC<AmountChipsProps> = ({
  amounts = [101, 251, 501, 1001, 2101, 5001],
  selectedAmount,
  onSelect,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-3 gap-2.5 sm:grid-cols-6', className)}>
      {amounts.map((amount) => {
        const isSelected = selectedAmount === amount;
        return (
          <button
            key={amount}
            type="button"
            onClick={() => onSelect(amount)}
            className={cn(
              'min-h-[48px] px-3 py-2 rounded-xl font-semibold text-base transition-all duration-150',
              'border-2 flex items-center justify-center select-none active:scale-95 touch-manipulation',
              isSelected
                ? 'bg-[#F97316] text-white border-[#F97316] shadow-md shadow-orange-500/25 ring-2 ring-[#F97316]/20'
                : 'bg-white text-[#292118] border-[#E5E1D8] hover:border-[#F97316]/60 hover:bg-orange-50/50'
            )}
          >
            ₹{amount.toLocaleString('en-IN')}
          </button>
        );
      })}
    </div>
  );
};
