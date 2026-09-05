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
  mr: { CASH: 'रोख (Cash)', UPI: 'यूपीआय (UPI)', PENDING: 'प्रलंबित (Pending)' },
  en: { CASH: 'Cash', UPI: 'UPI', PENDING: 'Pending' },
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
      className={`w-full max-w-[380px] mx-auto bg-white rounded-2xl overflow-hidden border border-[#E5E1D8] shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-left transition-all ${className}`}
      style={{
        fontFamily: "Inter, 'Noto Sans Devanagari', system-ui, sans-serif",
      }}
    >
      {/* 1. Header (Deep Royal Maroon with Gold Foil Accent) */}
      <div className="bg-gradient-to-br from-[#7C2D12] to-[#5C220E] px-5 py-4 text-center text-white relative border-b-2 border-[#FACC15]">
        {data.logoUrl ? (
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#FACC15] mx-auto mb-2 bg-white/10 shadow-md">
            <img
              src={data.logoUrl}
              alt={data.mandalName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-[#FACC15] text-[#FACC15] font-black text-base flex items-center justify-center mx-auto mb-2 shadow-md">
            {initials}
          </div>
        )}

        <h3 className="text-white text-base font-extrabold tracking-tight leading-snug">
          {data.mandalName}
        </h3>

        <p className="text-[#FACC15] text-xs font-semibold mt-0.5 tracking-wider">
          {data.deitySlogan || t.deityDefault}
        </p>

        <div className="mt-1 inline-flex items-center gap-1 bg-white/10 text-orange-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/15">
          <span>अधिकृत देणगी पावती</span>
        </div>
      </div>

      {/* 2. Metadata: Receipt No & Date */}
      <div className="px-5 pt-3.5 pb-1 space-y-1.5 bg-[#FCFBF9]">
        <div className="flex justify-between items-baseline text-xs pb-1.5 border-b border-[#E5E1D8]/60">
          <span className="text-[#6B6459] font-medium">{t.receiptNo}</span>
          <span className="font-mono font-bold text-[#7C2D12] text-xs tracking-wide bg-orange-50 px-2 py-0.5 rounded border border-orange-200/70">
            {data.receiptNumber}
          </span>
        </div>

        <div className="flex justify-between items-baseline text-xs pt-0.5">
          <span className="text-[#6B6459] font-medium">{t.date}</span>
          <span className="text-[#292118] font-medium tabular-nums">{data.createdAt}</span>
        </div>
      </div>

      {/* 3. Donor Details & Payment Mode */}
      <div className="px-5 py-2 space-y-1.5 bg-[#FCFBF9]">
        <div className="flex justify-between items-baseline text-xs pb-1.5 border-b border-[#E5E1D8]/60">
          <span className="text-[#6B6459] font-medium">{t.donor}</span>
          <span className="font-bold text-[#292118] text-sm text-right max-w-[200px] truncate">
            {data.donorName}
          </span>
        </div>

        <div className="flex justify-between items-baseline text-xs pt-0.5">
          <span className="text-[#6B6459] font-medium">{t.mode}</span>
          <span className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded text-[11px]">
            {modeLabel}
          </span>
        </div>
      </div>

      {/* 4. Amount Highlight Box */}
      <div className="mx-5 my-2.5 bg-gradient-to-br from-[#FFFDF9] to-[#FFF7ED] border border-[#FDBA74]/90 rounded-xl p-3 text-center shadow-2xs">
        <div className="text-[10px] font-bold text-[#C2410C] uppercase tracking-wider">
          {t.amount}
        </div>
        <div className="text-3xl font-black text-[#7C2D12] mt-0.5 tracking-tight tabular-nums">
          ₹{data.amount.toLocaleString('en-IN')}<span className="text-xl font-bold text-[#C2410C]">/-</span>
        </div>
        <div className="text-xs text-[#9A3412] font-medium mt-1 leading-snug">
          {data.amountInWords}
        </div>
      </div>

      {/* 5. QR Code & Verification Hint */}
      <div className="px-5 pb-3.5 flex items-center gap-3 bg-[#FCFBF9]">
        {data.qrCodeDataUrl ? (
          <img
            src={data.qrCodeDataUrl}
            alt="Receipt Verification QR"
            className="w-15 h-15 rounded-xl border border-[#E5E1D8] bg-white p-1 shrink-0 shadow-2xs"
          />
        ) : (
          <div className="w-15 h-15 rounded-xl border border-[#E5E1D8] bg-white flex items-center justify-center text-[10px] text-[#6B6459] shrink-0">
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
          className="text-[11px] font-medium text-[#7C2D12] hover:text-[#C2410C] transition truncate block hover:underline"
        >
          {data.verificationUrl.replace(/^https?:\/\//, '')}
        </a>
      </div>
    </div>
  );
};
