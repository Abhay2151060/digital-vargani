'use client';

import React from 'react';
import { PaymentMode } from '@vargani/types';

export type ReceiptLanguage = 'mr' | 'en';

export interface ReceiptData {
  mandalName: string;
  mandalInitials?: string;
  logoUrl?: string | null;
  deitySlogan?: string;
  receiptNumber: string;
  createdAt: string; // e.g. "23 Aug 2026, 5:42 PM" or date string
  donorName: string;
  paymentMode: PaymentMode;
  amount: number;
  amountInWords: string;
  qrCodeDataUrl?: string;
  verificationUrl: string;
  language: ReceiptLanguage;
}

const LABELS: Record<ReceiptLanguage, Record<string, string>> = {
  mr: {
    receiptNo: 'पावती क्र. (Receipt no.)',
    date: 'दिनांक (Date)',
    donor: 'देणगीदार (Donor)',
    mode: 'पेमेंट मोड (Mode)',
    amount: 'रक्कम (Amount)',
    verifyHint: 'पावती ऑनलाईन तपासण्यासाठी स्कॅन करा किंवा खालील लिंकला भेट द्या.',
    deityDefault: '॥ श्री गणेशाय नमः ॥',
  },
  en: {
    receiptNo: 'Receipt no.',
    date: 'Date',
    donor: 'Donor',
    mode: 'Mode',
    amount: 'Amount',
    verifyHint: 'Scan to verify this receipt online, or visit the link below.',
    deityDefault: '|| Shree Ganeshay Namah ||',
  },
};

const PAYMENT_MODE_LABELS: Record<ReceiptLanguage, Record<PaymentMode, string>> = {
  mr: { CASH: 'रोख (Cash)', UPI: 'यूपीआय (UPI)', BANK_TRANSFER: 'बँक ट्रान्सफर (Bank Transfer)', CHEQUE: 'धनादेश (Cheque)' },
  en: { CASH: 'Cash', UPI: 'UPI', BANK_TRANSFER: 'Bank transfer', CHEQUE: 'Cheque' },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Shared receipt UI — rendered on-screen (modal & verification page)
 * and captured for downloads.
 *
 * Theme colors:
 * - Maroon header: #7C2D12
 * - Saffron accent: #F97316 / #C2410C
 * - Gold/Marigold: #FACC15
 * - Warm background: #FFF7ED
 */
export const ReceiptCard: React.FC<{ data: ReceiptData; className?: string }> = ({ data, className = '' }) => {
  const langKey: ReceiptLanguage = data.language === 'en' ? 'en' : 'mr';
  const t = LABELS[langKey];
  const modeLabel = PAYMENT_MODE_LABELS[langKey][data.paymentMode] || data.paymentMode;
  const initials = data.mandalInitials || getInitials(data.mandalName);

  return (
    <div
      className={`w-full max-w-[380px] mx-auto bg-white rounded-2xl overflow-hidden border border-[#E5E1D8] shadow-md text-left transition-all ${className}`}
      style={{
        fontFamily: "Inter, 'Noto Sans Devanagari', system-ui, sans-serif",
      }}
    >
      {/* 1. Header (Deep Maroon) */}
      <div className="bg-[#7C2D12] px-5 py-4 text-center text-white relative">
        {data.logoUrl ? (
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#FACC15] mx-auto mb-2 bg-white/10 shadow-md">
            <img
              src={data.logoUrl}
              alt={data.mandalName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#FACC15] text-[#7C2D12] font-black text-base flex items-center justify-center mx-auto mb-2 shadow-md">
            {initials}
          </div>
        )}

        <h3 className="text-white text-base font-bold tracking-tight leading-snug">
          {data.mandalName}
        </h3>

        <p className="text-[#FACC15] text-xs font-semibold mt-0.5 tracking-wide">
          {data.deitySlogan || t.deityDefault}
        </p>
      </div>

      {/* 2. Metadata: Receipt No & Date */}
      <div className="px-5 pt-3 pb-1 space-y-1.5">
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-[#6B6459] font-medium">{t.receiptNo}</span>
          <span className="font-bold text-[#292118] text-sm tracking-wide bg-orange-50/80 px-2 py-0.5 rounded border border-orange-200/60 text-[#C2410C]">
            {data.receiptNumber}
          </span>
        </div>

        <div className="flex justify-between items-baseline text-xs">
          <span className="text-[#6B6459] font-medium">{t.date}</span>
          <span className="text-[#6B6459] font-medium">{data.createdAt}</span>
        </div>
      </div>

      {/* Dashed Separator */}
      <div className="mx-5 my-2 border-t border-dashed border-[#E5E1D8]" />

      {/* 3. Donor Details & Payment Mode */}
      <div className="px-5 space-y-1.5">
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-[#6B6459] font-medium">{t.donor}</span>
          <span className="font-bold text-[#292118] text-sm text-right max-w-[200px] truncate">
            {data.donorName}
          </span>
        </div>

        <div className="flex justify-between items-baseline text-xs">
          <span className="text-[#6B6459] font-medium">{t.mode}</span>
          <span className="font-semibold text-[#292118] bg-[#F3F1EC] px-2 py-0.5 rounded text-[11px]">
            {modeLabel}
          </span>
        </div>
      </div>

      {/* 4. Amount Highlight Box */}
      <div className="mx-5 my-3 bg-[#FFF7ED] border border-[#FDBA74] rounded-xl p-3.5 text-center shadow-xs">
        <div className="text-[11px] font-bold text-[#C2410C] uppercase tracking-wider">
          {t.amount}
        </div>
        <div className="text-3xl font-black text-[#C2410C] mt-0.5 tracking-tight">
          ₹{data.amount.toLocaleString('en-IN')}/-
        </div>
        <div className="text-xs text-[#9A5B36] font-medium mt-1 leading-snug">
          {data.amountInWords}
        </div>
      </div>

      {/* 5. QR Code & Verification Hint */}
      <div className="px-5 pb-3.5 flex items-center gap-3.5">
        {data.qrCodeDataUrl ? (
          <img
            src={data.qrCodeDataUrl}
            alt="Receipt Verification QR"
            className="w-16 h-16 rounded-lg border border-[#E5E1D8] bg-white p-0.5 shrink-0 shadow-xs"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg border border-[#E5E1D8] bg-[#FAF9F6] flex items-center justify-center text-[10px] text-[#6B6459] shrink-0">
            QR Code
          </div>
        )}

        <div className="text-[11px] text-[#6B6459] leading-relaxed">
          {t.verifyHint}
        </div>
      </div>

      {/* 6. Footer (Verification URL) */}
      <div className="bg-[#FAF9F6] border-t border-[#E5E1D8] px-4 py-2 text-center">
        <a
          href={data.verificationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-[#6B6459] hover:text-[#C2410C] transition truncate block"
        >
          {data.verificationUrl.replace(/^https?:\/\//, '')}
        </a>
      </div>
    </div>
  );
};
