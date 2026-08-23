'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { Button } from '@vargani/ui';
import { ShieldCheck, Download, Share2, ArrowLeft } from 'lucide-react';
import { generateReceiptPdf, numberToWordsIndian } from '../../../lib/receipt-generator';
import { buildWhatsAppReceiptLink, ReceiptLanguage } from '../../../lib/whatsapp-templates';
import { ReceiptCard } from '../../../components/ReceiptCard';
import { Language } from '@vargani/types';
import Link from 'next/link';

export default function ReceiptVerificationPage() {
  const params = useParams();
  const receiptNumber = params.receiptId as string;

  const [receipt, setReceipt] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<ReceiptLanguage>('mr');

  useEffect(() => {
    if (receiptNumber) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      fetch(`${apiBase}/donations/receipt/lookup/${receiptNumber}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setReceipt(data.data);
            setSelectedLang((data.data.language as ReceiptLanguage) || 'mr');
          } else {
            setError(data.message || 'Receipt not found');
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://digitalvargani.in';
      const verifyUrl = `${origin}/r/${receiptNumber}`;
      QRCode.toDataURL(verifyUrl, { margin: 1, width: 140 }).then(setQrUrl);
    }
  }, [receiptNumber]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F97316]"></div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FAF9F6] text-center">
        <div className="bg-white p-8 rounded-3xl border border-[#E5E1D8] shadow-md max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 text-lg font-bold">
            ✕
          </div>
          <h2 className="text-xl font-bold text-[#292118]">पावती आढळली नाही</h2>
          <p className="text-xs text-[#6B6459] mt-2">
            पावती क्र. <strong>{receiptNumber}</strong> साठी कोणतीही वैध नोंद आढळली नाही.
          </p>
          <Link href="/" className="mt-4 inline-block">
            <Button variant="primary" size="sm">मुख्यपृष्ठावर जा</Button>
          </Link>
        </div>
      </div>
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://digitalvargani.in';
  const verificationUrl = `${origin}/r/${receipt.receipt_number}`;
  const amountVal = parseFloat(receipt.amount);
  const amountInWords = numberToWordsIndian(amountVal, selectedLang as Language);

  const formattedDate = new Date(receipt.created_at).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleShareWhatsApp = () => {
    const url = buildWhatsAppReceiptLink({
      donorPhone: receipt.donor_phone,
      donorName: receipt.donor_name,
      mandalName: receipt.mandal_name,
      receiptNumber: receipt.receipt_number,
      amount: amountVal,
      amountInWords,
      receiptUrl: verificationUrl,
      language: selectedLang,
    });
    window.open(url, '_blank');
  };

  const handleDownloadPdf = async () => {
    const blob = await generateReceiptPdf({
      mandalName: receipt.mandal_name,
      mandalSlug: receipt.mandal_slug,
      receiptNumber: receipt.receipt_number,
      donorName: receipt.donor_name,
      donorPhone: receipt.donor_phone,
      amount: amountVal,
      paymentMode: receipt.payment_mode,
      flatWing: receipt.flat_wing,
      date: new Date(receipt.created_at).toLocaleDateString('en-IN'),
      volunteerName: receipt.volunteer_name,
      registrationNumber: receipt.registration_number,
      language: selectedLang as Language,
      logoUrl: receipt.logo_url || receipt.mandal_logo_url,
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt-${receipt.receipt_number}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#FAF9F6] py-8">
      <div className="w-full max-w-md space-y-4">
        {/* Verification Status Badge */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-200 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>अधिकृत व १००% डिजिटल प्रमाणित पावती</span>
          </div>
        </div>

        {/* Standard Receipt Card */}
        <ReceiptCard
          data={{
            mandalName: receipt.mandal_name,
            logoUrl: receipt.logo_url || receipt.mandal_logo_url,
            receiptNumber: receipt.receipt_number,
            createdAt: formattedDate,
            donorName: receipt.donor_name,
            paymentMode: receipt.payment_mode,
            amount: amountVal,
            amountInWords,
            qrCodeDataUrl: qrUrl,
            verificationUrl,
            language: selectedLang,
          }}
        />

        {/* Language Selector */}
        <div className="flex justify-center items-center gap-2 text-xs">
          <span className="text-[#6B6459] font-medium">भाषा (Language):</span>
          <div className="flex gap-1">
            {[
              { code: 'mr', label: 'मराठी' },
              { code: 'en', label: 'English' },
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => setSelectedLang(item.code as ReceiptLanguage)}
                className={`px-3 py-1 rounded-lg font-semibold text-xs transition ${
                  selectedLang === item.code
                    ? 'bg-[#F97316] text-white shadow-xs'
                    : 'bg-white text-[#6B6459] border border-[#E5E1D8] hover:bg-[#F3F1EC]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleDownloadPdf}
            className="font-bold gap-2 shadow-md shadow-orange-500/20"
          >
            <Download className="w-4 h-4" />
            <span>PDF पावती डाउनलोड करा (Download)</span>
          </Button>

          {receipt.donor_phone && (
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={handleShareWhatsApp}
              className="gap-2 font-semibold bg-white border-[#E5E1D8] text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>व्हॉट्सअॅपवर शेअर करा</span>
            </Button>
          )}
        </div>

        {/* Transparency Link */}
        <div className="text-center pt-2">
          <Link
            href={`/mandal/${receipt.mandal_slug}/transparency`}
            className="text-xs font-semibold text-[#F97316] hover:underline"
          >
            मंडळाचे सार्वजनिक पारदर्शकता पोर्टल पहा →
          </Link>
        </div>
      </div>
    </div>
  );
}
