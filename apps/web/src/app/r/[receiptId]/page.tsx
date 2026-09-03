'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import { Button } from '@vargani/ui';
import {
  ShieldCheck,
  Download,
  Share2,
  Copy,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Check
} from 'lucide-react';
import { generateReceiptPdf, numberToWordsIndian } from '../../../lib/receipt-generator';
import { buildWhatsAppReceiptLink, ReceiptLanguage } from '../../../lib/whatsapp-templates';
import { ReceiptCard } from '../../../components/ReceiptCard';
import { Language } from '@vargani/types';
import Link from 'next/link';

export default function ReceiptVerificationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const receiptNumber = params.receiptId as string;
  const mandalSlug = searchParams.get('mandal');

  const [receipt, setReceipt] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<ReceiptLanguage>('mr');
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (receiptNumber) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const receiptEndpoint = mandalSlug
        ? `${apiBase}/donations/receipt/${encodeURIComponent(mandalSlug)}/${encodeURIComponent(receiptNumber)}`
        : `${apiBase}/donations/receipt/lookup/${encodeURIComponent(receiptNumber)}`;
      fetch(receiptEndpoint)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setReceipt(data.data);
            setSelectedLang((data.data.language as ReceiptLanguage) || 'mr');
          } else {
            setError(data.message || 'पावती आढळली नाही (Receipt not found)');
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://digitalvargani.in';
      const receiptPath = mandalSlug
        ? `/r/${encodeURIComponent(mandalSlug)}/${encodeURIComponent(receiptNumber)}`
        : `/r/${encodeURIComponent(receiptNumber)}`;
      const verifyUrl = `${origin}${receiptPath}`;
      QRCode.toDataURL(verifyUrl, { margin: 1, width: 160 }).then(setQrUrl);
    }
  }, [receiptNumber, mandalSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] p-4">
        <div className="relative flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C2410C] to-[#F97316] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-orange-500/30 animate-bounce mb-4">
            🚩
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#F97316] border-t-transparent mb-2"></div>
          <p className="text-xs font-semibold text-[#6B6459]">पावती पडताळणी होत आहे...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FAF9F6] text-center">
        <div className="bg-white p-8 rounded-3xl border border-[#E5E1D8] shadow-xl max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl font-black shadow-inner">
            ✕
          </div>
          <h2 className="text-xl font-extrabold text-[#292118]">पावती आढळली नाही</h2>
          <p className="text-xs text-[#6B6459] mt-2 leading-relaxed">
            पावती क्रमांक <strong className="text-[#C2410C]">{receiptNumber}</strong> साठी कोणतीही नोंद आढळली नाही. कृपया पावती क्रमांक तपासा.
          </p>
          <div className="mt-6">
            <Link href="/">
              <Button variant="primary" size="md" className="font-bold">
                मुख्यपृष्ठावर जा (Go Home)
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://digitalvargani.in';
  const verificationUrl = `${origin}/r/${encodeURIComponent(receipt.mandal_slug)}/${encodeURIComponent(receipt.receipt_number)}`;
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    showToast('पावती लिंक कॉपी झाली! (Link Copied)');
    setTimeout(() => setCopied(false), 2500);
  };

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
    showToast('PDF डाउनलोड होत आहे...');
    try {
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
    } catch (e) {
      console.error('Failed to generate PDF', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF9F6] text-[#292118]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#292118] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/20 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Branding Navigation */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-[#E5E1D8] px-4 py-3 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#C2410C] to-[#F97316] flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-orange-500/20">
              🚩
            </div>
            <span className="font-extrabold text-base text-[#292118] tracking-tight">डिजिटल वर्गणी</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl border border-[#E5E1D8] bg-[#FAF9F6] hover:bg-[#F3F1EC] text-xs font-semibold text-[#6B6459] transition flex items-center gap-1.5"
              title="Copy Receipt Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#6B6459]" />}
              <span className="hidden sm:inline">{copied ? 'कॉपी झाले' : 'लिंक'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md mx-auto px-4 py-6 flex-1 space-y-5">
        {/* Verification Status Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-full text-xs font-extrabold border border-emerald-200 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>अधिकृत व १००% प्रमाणित डिजिटल पावती</span>
          </div>
          <p className="text-[11px] text-[#6B6459]">
            ही पावती डिजिटल वर्गणी प्लॅटफॉर्मद्वारे पडताळली गेली आहे.
          </p>
        </div>

        {/* Language Selector Bar */}
        <div className="flex justify-center items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-[#E5E1D8] shadow-2xs max-w-xs mx-auto text-xs">
          <span className="text-[#6B6459] font-medium">भाषा (Language):</span>
          <div className="flex gap-1">
            {[
              { code: 'mr', label: 'मराठी' },
              { code: 'en', label: 'English' },
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => setSelectedLang(item.code as ReceiptLanguage)}
                className={`px-3 py-1 rounded-xl font-bold text-xs transition ${
                  selectedLang === item.code
                    ? 'bg-gradient-to-r from-[#C2410C] to-[#F97316] text-white shadow-xs'
                    : 'bg-transparent text-[#6B6459] hover:bg-[#F3F1EC]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Receipt Card with Visual Elevation */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-amber-500 rounded-3xl blur-xs opacity-30 transition group-hover:opacity-50"></div>
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
            className="relative shadow-xl"
          />
        </div>

        {/* Action Buttons Suite */}
        <div className="space-y-2.5 pt-1">
          {/* Primary Action: Download PDF */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleDownloadPdf}
            className="font-extrabold text-sm gap-2 shadow-lg shadow-orange-500/25 min-h-[50px] bg-gradient-to-r from-[#C2410C] to-[#F97316] hover:from-[#9A3412] hover:to-[#EA580C]"
          >
            <Download className="w-4 h-4" />
            <span>PDF पावती डाउनलोड करा (Download)</span>
          </Button>

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-2 gap-2">
            {receipt.donor_phone && (
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={handleShareWhatsApp}
                className="gap-2 font-bold bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 text-xs"
              >
                <Share2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>व्हॉट्सॲप शेअर</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={handlePrint}
              className="gap-2 font-bold bg-white border-[#E5E1D8] text-[#292118] hover:bg-[#F3F1EC] text-xs"
            >
              <Printer className="w-4 h-4 text-[#6B6459] shrink-0" />
              <span>प्रिंट (Print)</span>
            </Button>
          </div>
        </div>

        {/* Mandal Transparency Card Banner */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] shadow-xs text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-[#F97316] shrink-0" />
            <h3 className="font-extrabold text-xs text-[#292118]">
              {receipt.mandal_name}
            </h3>
          </div>
          <p className="text-[11px] text-[#6B6459] leading-relaxed">
            आपली देणगी मंडळाच्या सार्वजनिक निधी खात्यात सुरक्षितपणे नोंदवली गेली आहे. जमा व खर्चाची पारदर्शक माहिती पाहण्यासाठी पोर्टलला भेट द्या.
          </p>
          <div className="mt-3 pt-2 border-t border-[#E5E1D8]/60 flex items-center justify-between">
            <Link
              href={`/mandal/${receipt.mandal_slug}/transparency`}
              className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-1"
            >
              <span>सार्वजनिक पारदर्शकता पोर्टल पहा</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <ExternalLink className="w-3.5 h-3.5 text-[#6B6459]" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-[11px] text-[#6B6459] border-t border-[#E5E1D8] bg-white">
        <p>© 2024 Digital Vargani. सर्व हक्क राखीव.</p>
      </footer>
    </div>
  );
}
