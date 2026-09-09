'use client';

import React from 'react';
import { PaymentMode, Language } from '@vargani/types';
import { formatBuildingDisplay } from '../lib/buildings';

export type ReceiptLanguage = 'mr' | 'en';

export interface ReceiptPaymentItem {
  id?: string;
  amount: number;
  paymentMode?: PaymentMode | string;
  payment_mode?: PaymentMode | string;
  date?: string;
  createdAt?: string;
  created_at?: string;
  collectedBy?: string;
  collected_by?: string;
  collector_name?: string;
}

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
  totalPaid?: number;
  remainingAmount?: number;
  paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID' | string;
  payments?: ReceiptPaymentItem[];
  flatWing?: string;
  donorPhone?: string;
}

const LABELS: Record<ReceiptLanguage, Record<string, string>> = {
  mr: {
    receiptNo: 'पावती क्र.',
    date: 'दिनांक',
    donor: 'देणगीदार',
    building: 'इमारत / पत्ता',
    mode: 'पेमेंट पद्धत',
    amount: 'एकूण देणगी रक्कम',
    totalContribution: 'एकूण वर्गणी',
    paidAmount: 'जमा रक्कम',
    remainingBalance: 'उर्वरित शिल्लक',
    paymentStatus: 'पेमेंट स्थिती',
    statusPaid: 'पूर्ण जमा (Paid)',
    statusPartial: 'अंशतः जमा (Partial)',
    statusPending: 'प्रलंबित (Pending)',
    paymentHistory: 'जमा इतिहास (Payment History)',
    noPaymentsYet: 'अद्याप कोणतीही रक्कम जमा झालेली नाही.',
    collectedBy: 'जमाकर्ता',
    verifyHint: 'पावती ऑनलाईन तपासण्यासाठी स्कॅन करा किंवा खालील लिंकला भेट द्या.',
    deityDefault: '॥ श्री गणेशाय नमः ॥',
    officialBadge: 'अधिकृत देणगी पावती',
  },
  en: {
    receiptNo: 'Receipt No.',
    date: 'Date',
    donor: 'Donor',
    building: 'Building / Address',
    mode: 'Payment Mode',
    amount: 'Total Contribution',
    totalContribution: 'Total Contribution',
    paidAmount: 'Paid So Far',
    remainingBalance: 'Remaining Balance',
    paymentStatus: 'Payment Status',
    statusPaid: 'Fully Paid',
    statusPartial: 'Partial',
    statusPending: 'Pending',
    paymentHistory: 'Payment History',
    noPaymentsYet: 'No payments recorded yet.',
    collectedBy: 'Collected by',
    verifyHint: 'Scan to verify this receipt online, or visit the link below.',
    deityDefault: '|| Shree Ganeshay Namah ||',
    officialBadge: 'Official Donation Receipt',
  },
};

const PAYMENT_MODE_LABELS: Record<ReceiptLanguage, Record<PaymentMode, string>> = {
  mr: { CASH: 'रोख', UPI: 'यूपीआय', PENDING: 'प्रलंबित' },
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
 */
export const ReceiptCard: React.FC<{ data: ReceiptData; className?: string }> = ({ data, className = '' }) => {
  const langKey: ReceiptLanguage = data.language === 'en' ? 'en' : 'mr';
  const t = LABELS[langKey];
  const modeLabel = PAYMENT_MODE_LABELS[langKey][data.paymentMode] || data.paymentMode;
  const initials = data.mandalInitials || getInitials(data.mandalName);

  const totalAmount = data.amount;
  const totalPaid = typeof data.totalPaid === 'number'
    ? data.totalPaid
    : (data.paymentMode === 'PENDING' ? 0 : data.amount);
  const remaining = typeof data.remainingAmount === 'number'
    ? data.remainingAmount
    : Math.max(0, totalAmount - totalPaid);
  
  const statusRaw = data.paymentStatus || (totalPaid === 0 ? 'PENDING' : remaining <= 0.01 ? 'PAID' : 'PARTIAL');
  const status = statusRaw.toUpperCase();

  const isPartialFlow = totalPaid < totalAmount || (data.payments && data.payments.length > 0) || status !== 'PAID';

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

        <div className="mt-1.5 inline-flex items-center gap-1.5">
          <span className="bg-white/10 text-orange-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/15">
            {t.officialBadge}
          </span>
          {/* Status Badge in Header */}
          {status === 'PAID' && (
            <span className="bg-emerald-500/20 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
              {t.statusPaid}
            </span>
          )}
          {status === 'PARTIAL' && (
            <span className="bg-blue-500/20 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
              {t.statusPartial}
            </span>
          )}
          {status === 'PENDING' && (
            <span className="bg-amber-500/20 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
              {t.statusPending}
            </span>
          )}
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

        {data.flatWing && (
          <div className="flex justify-between items-baseline text-xs pb-1.5 border-b border-[#E5E1D8]/60">
            <span className="text-[#6B6459] font-medium">{t.building}</span>
            <span className="font-semibold text-[#292118] text-right max-w-[220px]">
              {formatBuildingDisplay(data.flatWing, langKey === 'en' ? Language.ENGLISH : Language.MARATHI)}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-xs pt-0.5">
          <span className="text-[#6B6459] font-medium">{t.mode}</span>
          <span className={`font-semibold px-2 py-0.5 rounded text-[11px] border ${
            status === 'PENDING'
              ? 'text-amber-800 bg-amber-50 border-amber-200/80'
              : 'text-emerald-800 bg-emerald-50 border-emerald-200/80'
          }`}>
            {status === 'PARTIAL' ? `${t.statusPartial}` : modeLabel}
          </span>
        </div>
      </div>

      {/* 4. Amount Highlight Box */}
      <div className="mx-5 my-2.5 bg-gradient-to-br from-[#FFFDF9] to-[#FFF7ED] border border-[#FDBA74]/90 rounded-xl p-3 text-center shadow-2xs">
        <div className="text-[10px] font-bold text-[#C2410C] uppercase tracking-wider">
          {t.totalContribution}
        </div>
        <div className="text-3xl font-black text-[#7C2D12] mt-0.5 tracking-tight tabular-nums">
          ₹{totalAmount.toLocaleString('en-IN')}<span className="text-xl font-bold text-[#C2410C]">/-</span>
        </div>
        <div className="text-xs text-[#9A3412] font-medium mt-1 leading-snug">
          {data.amountInWords}
        </div>

        {/* Dynamic Payment Breakdown Card (Total, Paid, Remaining) */}
        {isPartialFlow && (
          <div className="mt-3 pt-2.5 border-t border-[#FDBA74]/50 grid grid-cols-2 gap-2 text-left">
            <div className="bg-white/80 p-2 rounded-lg border border-[#FDBA74]/40">
              <div className="text-[10px] font-medium text-[#6B6459]">{t.paidAmount}</div>
              <div className="text-sm font-extrabold text-emerald-700 tabular-nums mt-0.5">
                ₹{totalPaid.toLocaleString('en-IN')}
              </div>
            </div>
            <div className={`p-2 rounded-lg border ${
              remaining > 0
                ? 'bg-amber-50/80 border-amber-300/80'
                : 'bg-white/80 border-[#FDBA74]/40'
            }`}>
              <div className="text-[10px] font-medium text-[#6B6459]">{t.remainingBalance}</div>
              <div className={`text-sm font-extrabold tabular-nums mt-0.5 ${
                remaining > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                ₹{remaining.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Payment History / Audit Trail (Installments) */}
      {data.payments && data.payments.length > 0 && (
        <div className="px-5 py-2.5 bg-white border-t border-b border-[#E5E1D8]/80">
          <div className="text-[11px] font-bold text-[#7C2D12] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>{t.paymentHistory}</span>
            <span className="text-[10px] font-semibold text-[#6B6459] bg-[#F3F1EC] px-1.5 py-0.5 rounded">
              {data.payments.length} {langKey === 'en' ? (data.payments.length === 1 ? 'installment' : 'installments') : 'नोंदी'}
            </span>
          </div>
          <div className="space-y-1.5">
            {data.payments.map((p, idx) => {
              const pMode = (p.payment_mode || p.paymentMode || 'CASH') as PaymentMode;
              const pDate = p.created_at || p.createdAt || p.date;
              const formattedPDate = pDate
                ? new Date(pDate).toLocaleDateString(langKey === 'en' ? 'en-IN' : 'mr-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '';
              const collector = p.collector_name || p.collected_by || p.collectedBy;

              return (
                <div
                  key={p.id || idx}
                  className="flex items-center justify-between text-xs bg-[#FCFBF9] p-2 rounded-lg border border-[#E5E1D8]/70"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-[#C2410C] font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-[#292118] flex items-center gap-1.5">
                        <span>₹{Number(p.amount).toLocaleString('en-IN')}</span>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {PAYMENT_MODE_LABELS[langKey][pMode] || pMode}
                        </span>
                      </div>
                      {collector && (
                        <div className="text-[10px] text-[#6B6459] mt-0.5">
                          {t.collectedBy}: <span className="font-medium text-[#292118]">{collector}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {formattedPDate && (
                    <div className="text-[10px] text-[#6B6459] font-mono tabular-nums shrink-0">
                      {formattedPDate}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. QR Code & Verification Hint */}
      <div className="px-5 py-3 flex items-center gap-3 bg-[#FCFBF9]">
        {data.qrCodeDataUrl ? (
          <img
            src={data.qrCodeDataUrl}
            alt="Receipt Verification QR"
            className="w-14 h-14 rounded-xl border border-[#E5E1D8] bg-white p-1 shrink-0 shadow-2xs"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl border border-[#E5E1D8] bg-white flex items-center justify-center text-[10px] text-[#6B6459] shrink-0">
            QR Code
          </div>
        )}

        <div className="text-[11px] text-[#6B6459] leading-relaxed">
          {t.verifyHint}
        </div>
      </div>

      {/* 7. Footer (Verification URL) */}
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
