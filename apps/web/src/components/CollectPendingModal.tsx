'use client';

import React, { useState } from 'react';
import { Wallet, QrCode, X, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../lib/api-client';

interface CollectPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: {
    id: string;
    donor_name: string;
    receipt_number: string | number;
    amount: string | number;
    flat_wing?: string;
  } | null;
  onSuccess: (updatedDonation: any) => void;
}

export function CollectPendingModal({
  isOpen,
  onClose,
  donation,
  onSuccess,
}: CollectPendingModalProps) {
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !donation) return null;

  const handleConfirmCollect = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      const res = await apiRequest<{ data: any }>('/donations/collect-pending', {
        method: 'POST',
        body: JSON.stringify({
          donation_id: donation.id,
          payment_mode: paymentMode,
          payment_reference: paymentMode === 'UPI' ? paymentRef.trim() || undefined : undefined,
        }),
      });

      const updated = res?.data || res;
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to collect pending donation:', err);
      setError(err.message || 'वर्गणी जमा करण्यात त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E5E1D8] shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex justify-between items-center pb-3 border-b border-[#E5E1D8]">
          <div>
            <h3 className="text-base font-extrabold text-[#292118] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-600" />
              <span>येणे वर्गणी जमा करा (Collect Pending)</span>
            </h3>
            <p className="text-xs text-[#6B6459] mt-0.5">देणगीदाराकडून आलेली रक्कम जमा निश्चित करा</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E5E1D8] space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#6B6459]">देणगीदार:</span>
            <span className="font-bold text-[#292118]">{donation.donor_name}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#6B6459]">पावती क्र:</span>
            <span className="font-mono font-bold text-[#7C2D12]">#{donation.receipt_number}</span>
          </div>
          {donation.flat_wing && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#6B6459]">फ्लॅट / विंग:</span>
              <span className="text-[#292118]">{donation.flat_wing}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm pt-1 border-t border-[#E5E1D8]/60">
            <span className="font-bold text-[#292118]">रक्कम:</span>
            <span className="text-lg font-black text-[#7C2D12] tabular-nums">
              ₹{parseFloat(String(donation.amount)).toLocaleString('en-IN')}/-
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[#292118] block">भरणा प्रकार निवडा (Payment Mode)</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMode('UPI')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                paymentMode === 'UPI'
                  ? 'bg-orange-50 border-[#C2410C] text-[#C2410C] font-bold shadow-xs'
                  : 'bg-[#FAF9F6] border-[#E5E1D8] text-[#6B6459] hover:bg-gray-50'
              }`}
            >
              <QrCode className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs block">UPI द्वारे</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('CASH')}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                paymentMode === 'CASH'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold shadow-xs'
                  : 'bg-[#FAF9F6] border-[#E5E1D8] text-[#6B6459] hover:bg-gray-50'
              }`}
            >
              <Wallet className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs block">रोख (Cash)</span>
            </button>
          </div>
        </div>

        {paymentMode === 'UPI' && (
          <div>
            <label className="text-xs font-bold text-[#292118] block mb-1">
              UPI संदर्भ / UTR क्रमांक (पर्यायी)
            </label>
            <input
              type="text"
              placeholder="उदा. 4235XXXXXXXX किंवा बँक संदर्भ"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl text-xs sm:text-sm text-[#292118] focus:outline-none focus:border-[#C2410C]"
            />
          </div>
        )}

        {error && (
          <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-bold text-[#6B6459] hover:bg-[#FAF9F6] transition cursor-pointer"
          >
            रद्द करा
          </button>
          <button
            type="button"
            onClick={handleConfirmCollect}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <span>जमा होत आहे...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>जमा निश्चित करा</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
