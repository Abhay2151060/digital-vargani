'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { Modal, Button } from '@vargani/ui';
import { generateReceiptPdf, numberToWordsIndian } from '../lib/receipt-generator';
import { buildWhatsAppReceiptLink, getWhatsAppReceiptMessage, ReceiptLanguage } from '../lib/whatsapp-templates';
import { ReceiptCard } from './ReceiptCard';
import { Language, PaymentMode } from '@vargani/types';
import { getT } from '../lib/i18n';
import { Share2, Download, CheckCircle2, Copy, Check } from 'lucide-react';

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  donation: {
    receiptNumber: string;
    donorName: string;
    donorPhone?: string;
    amount: number;
    paymentMode: PaymentMode;
    flatWing?: string;
    date: string;
    volunteerName: string;
    language?: Language;
  } | null;
  mandal: {
    name: string;
    slug: string;
    logo_url?: string | null;
    registration_number?: string | null;
  } | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  donation,
  mandal,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<ReceiptLanguage>(
    (donation?.language as ReceiptLanguage) || 'mr'
  );
  const [isCopied, setIsCopied] = useState(false);
  const t = getT(selectedLang as Language);

  useEffect(() => {
    if (isOpen && donation && mandal) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#F97316', '#FACC15', '#16A34A'],
        });
      } catch (e) {}

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://digitalvargani.in';
      const verifyUrl = `${origin}/r/${encodeURIComponent(mandal.slug)}/${encodeURIComponent(donation.receiptNumber)}`;
      QRCode.toDataURL(verifyUrl, { margin: 1, width: 140 }).then(setQrUrl);
      setSelectedLang(((donation.language || 'mr') as ReceiptLanguage));
      setIsCopied(false);
    }
  }, [isOpen, donation, mandal]);

  if (!donation || !mandal) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://digitalvargani.in';
  const verificationUrl = `${origin}/r/${encodeURIComponent(mandal.slug)}/${encodeURIComponent(donation.receiptNumber)}`;
  const amountInWords = numberToWordsIndian(donation.amount, selectedLang as Language);

  const handleShareWhatsApp = () => {
    const url = buildWhatsAppReceiptLink({
      donorPhone: donation.donorPhone,
      donorName: donation.donorName,
      mandalName: mandal.name,
      receiptNumber: donation.receiptNumber,
      amount: donation.amount,
      amountInWords,
      receiptUrl: verificationUrl,
      language: selectedLang,
    });
    window.open(url, '_blank');
  };

  const handleCopyMessage = async () => {
    const message = getWhatsAppReceiptMessage({
      donorPhone: donation.donorPhone,
      donorName: donation.donorName,
      mandalName: mandal.name,
      receiptNumber: donation.receiptNumber,
      amount: donation.amount,
      amountInWords,
      receiptUrl: verificationUrl,
      language: selectedLang,
    });

    try {
      await navigator.clipboard.writeText(message);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleDownloadPdf = async () => {
    const blob = await generateReceiptPdf({
      mandalName: mandal.name,
      mandalSlug: mandal.slug,
      receiptNumber: donation.receiptNumber,
      donorName: donation.donorName,
      donorPhone: donation.donorPhone,
      amount: donation.amount,
      paymentMode: donation.paymentMode,
      flatWing: donation.flatWing,
      date: donation.date,
      volunteerName: donation.volunteerName,
      registrationNumber: mandal.registration_number || undefined,
      language: selectedLang as Language,
      logoUrl: mandal.logo_url,
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt-${donation.receiptNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" title="अधिकृत डिजिटल पावती (Digital Receipt)">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Success Banner */}
        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{t.receipt_generated}</span>
        </div>

        {/* Standard Receipt Card Component */}
        <ReceiptCard
          data={{
            mandalName: mandal.name,
            logoUrl: mandal.logo_url,
            receiptNumber: donation.receiptNumber,
            createdAt: donation.date,
            donorName: donation.donorName,
            paymentMode: donation.paymentMode,
            amount: donation.amount,
            amountInWords,
            qrCodeDataUrl: qrUrl,
            verificationUrl,
            language: selectedLang,
          }}
        />

        {/* Language Selector */}
        <div className="flex items-center gap-2 text-xs pt-1">
          <span className="text-[#6B6459] font-medium">{t.receipt_language}:</span>
          <div className="flex gap-1">
            {[
              { code: 'mr', label: 'मराठी' },
              { code: 'en', label: 'English' },
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => setSelectedLang(item.code as ReceiptLanguage)}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  selectedLang === item.code
                    ? 'bg-[#F97316] text-white shadow-xs'
                    : 'bg-[#F3F1EC] text-[#6B6459] hover:bg-[#E5E1D8]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2 pt-2">
          {/* WhatsApp Direct Share */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleShareWhatsApp}
            className="bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold gap-2 shadow-md shadow-emerald-600/20 min-h-[48px]"
          >
            <Share2 className="w-5 h-5" />
            <span>{t.share_whatsapp}</span>
          </Button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={handleCopyMessage}
              className="gap-1.5 font-semibold text-xs border-[#E5E1D8]"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">कॉपी झाले!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#6B6459]" />
                  <span>मॅसेज कॉपी करा</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={handleDownloadPdf}
              className="gap-1.5 font-semibold text-xs border-[#E5E1D8]"
            >
              <Download className="w-4 h-4 text-[#F97316]" />
              <span>{t.download_receipt}</span>
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-[#6B6459]">
            <span>{t.close}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
