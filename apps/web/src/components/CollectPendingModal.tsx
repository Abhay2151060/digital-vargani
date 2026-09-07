'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, QrCode, X, CheckCircle2, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api-client';
import { getT } from '../lib/i18n';

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
  const { activeMandal, language } = useAuth();
  const t = getT(language);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Admin Uploaded QR & UPI Details
  const [adminQrUrl, setAdminQrUrl] = useState<string | null>(activeMandal?.upi_qr_url || null);
  const [upiId, setUpiId] = useState<string>(activeMandal?.upi_id || '');
  const [dynamicQr, setDynamicQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch the latest mandal data to ensure we have the Admin's uploaded QR code
  useEffect(() => {
    if (isOpen) {
      if (activeMandal?.upi_qr_url) {
        setAdminQrUrl(activeMandal.upi_qr_url);
      }
      if (activeMandal?.upi_id) {
        setUpiId(activeMandal.upi_id);
      }

      // Fetch fresh mandal profile to catch any newly uploaded QR code
      apiRequest<{ data: any }>('/mandals/current')
        .then((res) => {
          const m = res?.data || res;
          if (m?.upi_qr_url) setAdminQrUrl(m.upi_qr_url);
          if (m?.upi_id) setUpiId(m.upi_id);
        })
        .catch((err) => {
          console.warn('Could not refresh mandal QR code:', err);
        });
    }
  }, [isOpen, activeMandal]);

  // Generate dynamic QR code fallback if needed
  useEffect(() => {
    if (paymentMode === 'UPI' && donation) {
      const targetUpi = upiId || activeMandal?.upi_id || 'shivneri@upi';
      const mandalName = activeMandal?.name || 'Digital Vargani';
      const upiUrl = `upi://pay?pa=${encodeURIComponent(targetUpi)}&pn=${encodeURIComponent(mandalName)}&am=${donation.amount}&cu=INR&tn=${encodeURIComponent('Vargani - #' + donation.receipt_number)}`;
      
      QRCode.toDataURL(upiUrl, {
        margin: 1,
        width: 220,
        color: { dark: '#1E293B', light: '#FFFFFF' },
      })
        .then((url) => setDynamicQr(url))
        .catch((err) => console.error('Failed to generate UPI QR:', err));
    }
  }, [paymentMode, donation, upiId, activeMandal]);

  if (!isOpen || !donation) return null;

  const handleCopyUpi = async () => {
    const targetUpi = upiId || activeMandal?.upi_id || 'shivneri@upi';
    try {
      await navigator.clipboard.writeText(targetUpi);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy UPI ID:', err);
    }
  };

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
      setError(err.message || t.collect_error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-[#E5E1D8] shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 my-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-[#E5E1D8]">
          <div>
            <h3 className="text-base font-extrabold text-[#292118] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-600" />
              <span>{t.collect_pending_title}</span>
            </h3>
            <p className="text-xs text-[#6B6459] mt-0.5">{t.collect_pending_sub}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Donation Details Card */}
        <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E5E1D8] space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#6B6459]">{t.donor}:</span>
            <span className="font-bold text-[#292118]">{donation.donor_name}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#6B6459]">{t.receipt_no}:</span>
            <span className="font-mono font-bold text-[#7C2D12]">#{donation.receipt_number}</span>
          </div>
          {donation.flat_wing && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#6B6459]">{t.flat_wing}:</span>
              <span className="text-[#292118]">{donation.flat_wing}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm pt-1 border-t border-[#E5E1D8]/60">
            <span className="font-bold text-[#292118]">{t.amount}:</span>
            <span className="text-lg font-black text-[#7C2D12] tabular-nums">
              ₹{parseFloat(String(donation.amount)).toLocaleString('en-IN')}/-
            </span>
          </div>
        </div>

        {/* Payment Mode Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#292118] block">{t.select_payment_mode}</label>
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
              <span className="text-xs block">{t.via_upi}</span>
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
              <span className="text-xs block">{t.via_cash}</span>
            </button>
          </div>
        </div>

        {/* UPI QR Code Container (Displayed when UPI is selected) */}
        {paymentMode === 'UPI' && (
          <div className="p-3.5 bg-gradient-to-br from-orange-50/60 to-amber-50/40 rounded-2xl border border-orange-200/80 text-center space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C2D12]">
                <QrCode className="w-4 h-4 text-[#C2410C]" />
                <span>
                  {adminQrUrl ? t.mandal_official_qr : t.scan_to_pay}
                </span>
              </div>
              <span className="text-xs font-black text-[#7C2D12] bg-white px-2.5 py-0.5 rounded-full border border-orange-200 shadow-2xs">
                ₹{parseFloat(String(donation.amount)).toLocaleString('en-IN')}
              </span>
            </div>

            {/* QR Image Box */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-2.5 bg-white rounded-2xl border-2 border-orange-200/90 shadow-xs inline-block">
                {adminQrUrl ? (
                  <img
                    src={adminQrUrl}
                    alt="Admin Uploaded Mandal QR Code"
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-xl"
                  />
                ) : dynamicQr ? (
                  <img
                    src={dynamicQr}
                    alt="UPI Payment QR Code"
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-44 h-44 flex flex-col items-center justify-center bg-gray-50 rounded-xl text-xs text-gray-400">
                    <QrCode className="w-8 h-8 mb-1 animate-pulse text-orange-400" />
                    <span>{t.qr_loading}</span>
                  </div>
                )}
              </div>

              {adminQrUrl ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{t.admin_uploaded_qr_badge}</span>
                </span>
              ) : (
                <p className="text-[10px] text-[#6B6459] mt-1.5 font-medium">
                  {t.scan_via_apps_hint}
                </p>
              )}
            </div>

            {/* UPI ID & Copy Row */}
            {(upiId || activeMandal?.upi_id) && (
              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-orange-200 text-xs">
                <div className="text-left truncate mr-2">
                  <span className="text-[10px] text-[#8C857B] font-medium block">UPI ID:</span>
                  <span className="font-mono font-bold text-[#292118] truncate block">
                    {upiId || activeMandal?.upi_id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-2.5 py-1 text-xs font-bold text-[#C2410C] bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.copied : t.copy}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* UPI UTR Reference Input */}
        {paymentMode === 'UPI' && (
          <div>
            <label className="text-xs font-bold text-[#292118] block mb-1">
              {t.utr_reference_optional}
            </label>
            <input
              type="text"
              placeholder={t.utr_reference_placeholder}
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

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-bold text-[#6B6459] hover:bg-[#FAF9F6] transition cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirmCollect}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <span>{t.collecting}</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.confirm_collect_btn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
