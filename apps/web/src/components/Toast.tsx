'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
  durationMs = 4000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [onClose, durationMs]);

  const bgStyles =
    type === 'success'
      ? 'bg-emerald-800 text-white shadow-emerald-900/20'
      : type === 'error'
      ? 'bg-red-800 text-white shadow-red-900/20'
      : 'bg-slate-800 text-white shadow-slate-900/20';

  const Icon =
    type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info;

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border border-white/10 transition-all transform animate-bounce-short ${bgStyles}`}
      role="alert"
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-xs font-semibold">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-white/20 rounded-md transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
