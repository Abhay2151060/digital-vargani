'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, QrCode, X, CheckCircle2, Copy, Check, IndianRupee, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api-client';
import { getT } from '../lib/i18n';
import { Language } from '@vargani/types';

interface CollectPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: {
    id: string;
    donor_name: string;
    receipt_number: string | number;
    amount: string | number;
    total_paid?: string | number;
    remaining_amount?: string | number;
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
  const [collectAmount, setCollectAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Admin Uploaded QR & UPI Details
  const [adminQrUrl, setAdminQrUrl] = useState<string | null>(activeMandal?.upi_qr_url || null);
  const [upiId, setUpiId] = useState<string>(activeMandal?.upi_id || '');
  const [dynamicQr, setDynamicQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Financial calculations
  const totalAmount = donation ? parseFloat(donation.amount.toString()) : 0;
  const alreadyPaid = donation?.total_paid != null ? parseFloat(donation.total_paid.toString()) : 0;
  const remainingAmount =
    donation?.remaining_amount != null
      ? parseFloat(donation.remaining_amount.toString())
      : Math.max(0, totalAmount - alreadyPaid);

  useEffect(() => {
    if (donation && isOpen) {
      const rem =
        donation.remaining_amount != null
          ? parseFloat(donation.remaining_amount.toString())
          : Math.max(0, parseFloat(donation.amount.toString()) - (parseFloat(donation.total_paid?.toString() || '0')));
      setCollectAmount(rem > 0 ? rem.toString() : donation.amount.toString());
      setError('');
      setPaymentRef('');
    }
  }, [donation, isOpen]);

  // Fetch the latest mandal data to ensure we have the Admin's uploaded QR code
  useEffect(() => {
    if (isOpen) {
      if (activeMandal?.upi_qr_url) {
        setAdminQrUrl(activeMandal.upi_qr_url);
      }
      if (activeMandal?.upi_id) {
        setUpiId(activeMandal.upi_id);
      }

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

  // Generate dynamic QR code fallback using the actual collection amount
  useEffect(() => {
    const payAmt = parseFloat(collectAmount);
    if (paymentMode === 'UPI' && donation && !isNaN(payAmt) && payAmt > 0) {
      const targetUpi = upiId || activeMandal?.upi_id || 'shivneri@upi';
      const mandalName = activeMandal?.name || 'Digital Vargani';
      const upiUrl = `upi://pay?pa=${encodeURIComponent(targetUpi)}&pn=${encodeURIComponent(mandalName)}&am=${payAmt}&cu=INR&tn=${encodeURIComponent('Vargani - #' + donation.receipt_number)}`;

      QRCode.toDataURL(upiUrl, {
        margin: 1,
        width: 220,
        color: { dark: '#1E293B', light: '#FFFFFF' },
      })
        .then((url) => setDynamicQr(url))
        .catch((err) => console.error('Failed to generate UPI QR:', err));
    }
  }, [paymentMode, donation, collectAmount, upiId, activeMandal]);

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

  const payAmountNum = parseFloat(collectAmount);
  const isAmountValid = !isNaN(payAmountNum) && payAmountNum > 0 && payAmountNum <= remainingAmount + 0.001;

  const handleConfirmCollect = async () => {
    if (!isAmountValid) {
      if (isNaN(payAmountNum) || payAmountNum <= 0) {
        setError(language === Language.ENGLISH ? 'Please enter a valid amount.' : 'कृपया वैध रक्कम प्रविष्ट करा.');
      } else if (payAmountNum > remainingAmount) {
        setError(
          language === Language.ENGLISH
            ? `Amount cannot exceed remaining balance of ₹${remainingAmount.toLocaleString('en-IN')}`
            : `जमा रक्कम शिल्लक रकमेपेक्षा (₹${remainingAmount.toLocaleString('en-IN')}) जास्त असू शकत नाही.`
        );
      }
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const res = await apiRequest<{ data: any }>('/donations/collect-pending', {
        method: 'POST',
        body: JSON.stringify({
          donation_id: donation.id,
          amount: payAmountNum,
          payment_mode: paymentMode,
          payment_reference: paymentMode === 'UPI' ? paymentRef.trim() || undefined : undefined,
        }),
      });

      const updated = res?.data || res;
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to collect donation installment:', err);
      setError(err.message || t.collect_error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preset chip options for installment
  const presetChips = [100, 200, 500, 1000].filter((val) => val < remainingAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-[#E5E1D8] shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 my-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-[#E5E1D8]">
          <div>
            <h3 className="text-base font-extrabold text-[#292118] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-600" />
              <span>{language === Language.ENGLISH ? 'Collect Contribution Payment' : 'वर्गणी रक्कम जमा करा'}</span>
            </h3>
            <p className="text-xs text-[#6B6459] mt-0.5">
              {language === Language.ENGLISH ? 'Record full or partial payment installment' : 'पूर्ण किंवा हप्त्यांची वर्गणी नोंदवा'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Donor & Receipt Info */}
        <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E5E1D8] space-y-1.5">
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

          {/* 3-Part Financial Summary */}
          <div className="grid grid-cols-3 gap-2 pt-2.5 mt-1 border-t border-[#E5E1D8]/80 text-center">
            <div className="bg-white rounded-xl p-2 border border-[#E5E1D8]/70">
              <span className="text-[10px] text-[#6B6459] font-medium block">
                {language === Language.ENGLISH ? 'Total Amount' : 'एकूण वर्गणी'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#292118] tabular-nums">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-white rounded-xl p-2 border border-emerald-100">
              <span className="text-[10px] text-emerald-700 font-medium block">
                {language === Language.ENGLISH ? 'Already Paid' : 'आधी जमा'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-700 tabular-nums">
                ₹{alreadyPaid.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-amber-50 rounded-xl p-2 border border-amber-200">
              <span className="text-[10px] text-amber-800 font-medium block">
                {language === Language.ENGLISH ? 'Remaining' : 'शिल्लक बाकी'}
              </span>
              <span className="text-xs sm:text-sm font-black text-amber-800 tabular-nums">
                ₹{remainingAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Enter Payment Amount */}
        <div className="space-y-1.5 text-left">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-[#292118]">
              {language === Language.ENGLISH ? 'Now Collecting Amount (₹)' : 'आता जमा करायची रक्कम (₹)'}
            </label>
            <span className="text-[11px] font-bold text-amber-700">
              {language === Language.ENGLISH ? `Max: ₹${remainingAmount.toLocaleString('en-IN')}` : `कमाल: ₹${remainingAmount.toLocaleString('en-IN')}`}
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6B6459]">₹</span>
            <input
              type="number"
              min="1"
              max={remainingAmount}
              step="any"
              value={collectAmount}
              onChange={(e) => {
                setCollectAmount(e.target.value);
                setError('');
              }}
              placeholder={language === Language.ENGLISH ? `e.g. ${remainingAmount}` : `उदा. ${remainingAmount}`}
              className={`w-full pl-8 pr-4 py-2.5 bg-white border-2 rounded-xl text-base font-black tabular-nums transition focus:outline-none ${
                payAmountNum > remainingAmount
                  ? 'border-rose-400 text-rose-700 focus:border-rose-500'
                  : 'border-[#E5E1D8] text-[#292118] focus:border-[#C2410C]'
              }`}
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-[#A8A297] font-medium mr-1">
              {language === Language.ENGLISH ? 'Quick:' : 'क्विक:'}
            </span>
            {presetChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setCollectAmount(chip.toString())}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#E5E1D8] bg-[#FAF9F6] text-[#6B6459] hover:bg-orange-50 hover:border-orange-200 hover:text-[#C2410C] transition cursor-pointer"
              >
                ₹{chip}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCollectAmount(remainingAmount.toString())}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer"
            >
              {language === Language.ENGLISH ? `Full (₹${remainingAmount})` : `पूर्ण बाकी (₹${remainingAmount})`}
            </button>
          </div>

          {payAmountNum > remainingAmount && (
            <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {language === Language.ENGLISH
                  ? `Cannot collect more than remaining ₹${remainingAmount.toLocaleString('en-IN')}`
                  : `शिल्लक ₹${remainingAmount.toLocaleString('en-IN')} पेक्षा जास्त रक्कम जमा करता येत नाही.`}
              </span>
            </p>
          )}
        </div>

        {/* Payment Mode Selection */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-bold text-[#292118] block">{t.select_payment_mode}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMode('UPI')}
              className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
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
              className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
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

        {/* UPI QR Code Container */}
        {paymentMode === 'UPI' && (
          <div className="p-3.5 bg-gradient-to-br from-orange-50/60 to-amber-50/40 rounded-2xl border border-orange-200/80 text-center space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7C2D12]">
                <QrCode className="w-4 h-4 text-[#C2410C]" />
                <span>{adminQrUrl ? t.mandal_official_qr : t.scan_to_pay}</span>
              </div>
              <span className="text-xs font-black text-[#7C2D12] bg-white px-2.5 py-0.5 rounded-full border border-orange-200 shadow-2xs">
                ₹{isAmountValid ? payAmountNum.toLocaleString('en-IN') : '0'}
              </span>
            </div>

            {/* QR Image Box */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-2.5 bg-white rounded-2xl border-2 border-orange-200/90 shadow-xs inline-block">
                {adminQrUrl ? (
                  <img
                    src={adminQrUrl}
                    alt="Admin Uploaded Mandal QR Code"
                    className="w-40 h-40 object-contain rounded-xl"
                  />
                ) : dynamicQr ? (
                  <img
                    src={dynamicQr}
                    alt="UPI Payment QR Code"
                    className="w-40 h-40 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-40 h-40 flex flex-col items-center justify-center bg-gray-50 rounded-xl text-xs text-gray-400">
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
          <div className="text-left">
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
          <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-left">
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
            disabled={isSubmitting || !isAmountValid}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <span>{t.collecting}</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {language === Language.ENGLISH
                    ? `Confirm ₹${isAmountValid ? payAmountNum.toLocaleString('en-IN') : '0'}`
                    : `₹${isAmountValid ? payAmountNum.toLocaleString('en-IN') : '0'} जमा नोंदवा`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
