import React, { useEffect } from 'react';
import { cn } from '../utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={cn(
          'w-full bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#E5E1D8] max-h-[90vh] flex flex-col',
          maxWidthStyles[maxWidth],
          'animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200'
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E1D8]">
          <h3 className="text-lg font-bold text-[#292118]">{title || ''}</h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-[#6B6459] hover:bg-[#F3F1EC] hover:text-[#292118] transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
