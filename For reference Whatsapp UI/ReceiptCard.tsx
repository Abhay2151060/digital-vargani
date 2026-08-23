import React from 'react';

export type ReceiptLanguage = 'mr' | 'hi' | 'gu' | 'en';
export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';

export interface ReceiptData {
  mandalName: string;
  mandalInitials: string; // fallback avatar when no logo is set
  logoUrl?: string;
  deitySlogan?: string; // e.g. "|| श्री गणेशाय नमः ||"
  receiptNumber: string;
  createdAt: string; // pre-formatted display date, e.g. "23 Aug 2026, 5:42 PM"
  donorName: string;
  paymentMode: PaymentMode;
  amount: number;
  amountInWords: string; // pre-computed by the amount-in-words utility for the given language
  qrCodeDataUrl: string; // data URL for the verification QR (generated client-side via `qrcode`)
  verificationUrl: string; // short display URL shown under the QR
  language: ReceiptLanguage;
}

const LABELS: Record<ReceiptLanguage, Record<string, string>> = {
  en: {
    receiptNo: 'Receipt no.',
    date: 'Date',
    donor: 'Donor',
    mode: 'Mode',
    amount: 'Amount',
    verifyHint: 'Scan to verify this receipt online, or visit the link below.',
  },
  mr: {
    receiptNo: 'पावती क्र.',
    date: 'दिनांक',
    donor: 'देणगीदार',
    mode: 'प्रकार',
    amount: 'रक्कम',
    verifyHint: 'पावती ऑनलाईन तपासण्यासाठी स्कॅन करा किंवा खालील लिंकला भेट द्या.',
  },
  hi: {
    receiptNo: 'रसीद क्र.',
    date: 'दिनांक',
    donor: 'दानदाता',
    mode: 'भुगतान प्रकार',
    amount: 'राशि',
    verifyHint: 'रसीद ऑनलाइन सत्यापित करने के लिए स्कैन करें, या नीचे दिए गए लिंक पर जाएं।',
  },
  gu: {
    receiptNo: 'રસીદ ક્ર.',
    date: 'તારીખ',
    donor: 'દાતા',
    mode: 'ચુકવણી પ્રકાર',
    amount: 'રકમ',
    verifyHint: 'રસીદ ઓનલાઇન ચકાસવા સ્કેન કરો, અથવા નીચેની લિંક ખોલો.',
  },
};

const PAYMENT_MODE_LABELS: Record<ReceiptLanguage, Record<PaymentMode, string>> = {
  en: { CASH: 'Cash', UPI: 'UPI', BANK_TRANSFER: 'Bank transfer', CHEQUE: 'Cheque' },
  mr: { CASH: 'रोख', UPI: 'यूपीआय', BANK_TRANSFER: 'बँक ट्रान्सफर', CHEQUE: 'धनादेश' },
  hi: { CASH: 'नकद', UPI: 'यूपीआई', BANK_TRANSFER: 'बैंक ट्रांसफर', CHEQUE: 'चेक' },
  gu: { CASH: 'રોકડ', UPI: 'યુપીઆઈ', BANK_TRANSFER: 'બેંક ટ્રાન્સફર', CHEQUE: 'ચેક' },
};

/**
 * Shared receipt UI — rendered both on-screen (post-submission confirmation)
 * and captured to canvas/PDF via jsPDF for the downloadable receipt (see
 * apps/web/src/lib/receipt-generator.ts). Keep this component free of
 * anything that doesn't render identically in both contexts (no hover
 * states, no client-only interactivity).
 *
 * Design tokens follow design.md: maroon header (#7C2D12), saffron accent
 * (#F97316 family), marigold avatar fallback (#FACC15).
 */
export function ReceiptCard({ data }: { data: ReceiptData }) {
  const t = LABELS[data.language];
  const modeLabel = PAYMENT_MODE_LABELS[data.language][data.paymentMode];

  return (
    <div
      style={{
        maxWidth: 380,
        background: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #E5E1D8',
        fontFamily:
          "Inter, 'Noto Sans Devanagari', 'Noto Sans Gujarati', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ background: '#7C2D12', padding: '18px 20px', textAlign: 'center' }}>
        {data.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.logoUrl}
            alt={data.mandalName}
            style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 8px', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#FACC15',
              margin: '0 auto 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 500,
              color: '#7C2D12',
            }}
          >
            {data.mandalInitials}
          </div>
        )}
        <div style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 500 }}>{data.mandalName}</div>
        {data.deitySlogan && (
          <div style={{ color: '#FACC15', fontSize: 12, marginTop: 2 }}>{data.deitySlogan}</div>
        )}
      </div>

      {/* Receipt meta */}
      <Row label={t.receiptNo} value={data.receiptNumber} bold />
      <Row label={t.date} value={data.createdAt} muted />

      <div style={{ borderTop: '1px dashed #E5E1D8', margin: '0 20px' }} />

      <Row label={t.donor} value={data.donorName} bold />
      <Row label={t.mode} value={modeLabel} />

      {/* Amount block */}
      <div
        style={{
          margin: '14px 20px',
          background: '#FFF7ED',
          border: '1px solid #FDBA74',
          borderRadius: 10,
          padding: '14px 16px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 11, color: '#C2410C', marginBottom: 2 }}>{t.amount}</div>
        <div style={{ fontSize: 26, fontWeight: 500, color: '#C2410C' }}>
          {'\u20B9'}
          {data.amount.toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: 11, color: '#9A5B36', marginTop: 4 }}>{data.amountInWords}</div>
      </div>

      {/* QR + verification */}
      <div style={{ padding: '4px 20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.qrCodeDataUrl}
          alt="Verification QR code"
          width={64}
          height={64}
          style={{ borderRadius: 8, flexShrink: 0 }}
        />
        <div style={{ fontSize: 11, color: '#6B6459', lineHeight: 1.5 }}>{t.verifyHint}</div>
      </div>

      {/* Footer */}
      <div
        style={{
          background: '#FAF9F6',
          borderTop: '1px solid #E5E1D8',
          padding: '10px 20px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: '#6B6459' }}>{data.verificationUrl}</span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        padding: '4px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}
    >
      <span style={{ fontSize: 12, color: '#6B6459' }}>{label}</span>
      <span
        style={{
          fontSize: bold ? 14 : 13,
          fontWeight: bold ? 500 : 400,
          color: muted ? '#6B6459' : '#292118',
        }}
      >
        {value}
      </span>
    </div>
  );
}
