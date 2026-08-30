'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { AuthGuard } from '../../../components/AuthGuard';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { ReceiptModal } from '../../../components/ReceiptModal';
import { Input, Button, Card, AmountChips, BottomNav } from '@vargani/ui';
import { PaymentMode, Language, Role } from '@vargani/types';
import { getT } from '../../../lib/i18n';
import { apiRequest } from '../../../lib/api-client';
import { PlusCircle, Wallet, QrCode, IndianRupee, User, Phone, Home, Sparkles, Receipt, ArrowLeft, Clock, Copy, Check, ShieldCheck, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import Link from 'next/link';

export default function CollectDonationPage() {
  const { user, role, activeMandal, language, token } = useAuth();
  const t = getT(language);
  const router = useRouter();

  const handleBack = () => {
    if (role === Role.TREASURER || role === Role.ADMIN) {
      router.push('/dashboard');
    } else if (role === Role.VOLUNTEER) {
      router.push('/history');
    } else {
      router.back();
    }
  };

  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [amount, setAmount] = useState<number>(501);
  const [customAmount, setCustomAmount] = useState<string>('501');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(PaymentMode.CASH);
  const [paymentRef, setPaymentRef] = useState('');
  const [flatWing, setFlatWing] = useState('');
  const [receiptLang, setReceiptLang] = useState<Language>(language || Language.MARATHI);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDonation, setGeneratedDonation] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dynamic UPI QR code & copy state
  const [dynamicUpiQr, setDynamicUpiQr] = useState<string>('');
  const [isUpiCopied, setIsUpiCopied] = useState(false);

  // Volunteer's local allocation range
  const [allocation, setAllocation] = useState<any | null>(null);

  useEffect(() => {
    if (activeMandal && token && (role === Role.ADMIN || role === Role.TREASURER)) {
      apiRequest<any>('/donations/my-allocation')
        .then(setAllocation)
        .catch(console.error);
    }
  }, [activeMandal, token, role]);

  useEffect(() => {
    if (paymentMode === PaymentMode.UPI && activeMandal) {
      const upiId = activeMandal.upi_id || 'shivneri@upi';
      const mandalName = activeMandal.name || 'Digital Vargani';
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(mandalName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Vargani - ' + (donorName.trim() || 'Donation'))}`;

      QRCode.toDataURL(upiUrl, {
        margin: 1,
        width: 220,
        color: {
          dark: '#1E293B',
          light: '#FFFFFF',
        },
      })
        .then((url) => setDynamicUpiQr(url))
        .catch((err) => console.error('Failed to generate UPI QR:', err));
    }
  }, [paymentMode, activeMandal, amount, donorName]);

  const handleCopyUpiId = async () => {
    const upiId = activeMandal?.upi_id || 'shivneri@upi';
    try {
      await navigator.clipboard.writeText(upiId);
      setIsUpiCopied(true);
      setTimeout(() => setIsUpiCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy UPI ID', e);
    }
  };

  const handleAmountChipSelect = (amt: number) => {
    setAmount(amt);
    setCustomAmount(String(amt));
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) {
      setError(t.donor_name);
      return;
    }
    if (amount <= 0) {
      setError(t.amount);
      return;
    }
    if (paymentMode === PaymentMode.UPI && !paymentRef.trim()) {
      // Optional reference or reminder
    }

    setError(null);
    setIsSubmitting(true);

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const dateFormatted = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    try {
      if (isOnline) {
        const donation = await apiRequest<any>('/donations', {
          method: 'POST',
          body: JSON.stringify({
            donor_name: donorName.trim(),
            donor_phone: donorPhone.trim() || undefined,
            amount: amount,
            payment_mode: paymentMode,
            payment_reference: paymentRef.trim() || undefined,
            flat_wing: flatWing.trim() || undefined,
            language: receiptLang,
          }),
        });

        setGeneratedDonation({
          receiptNumber: donation.receipt_number,
          donorName: donation.donor_name,
          donorPhone: donation.donor_phone,
          amount: parseFloat(donation.amount),
          paymentMode: donation.payment_mode,
          flatWing: donation.flat_wing,
          date: dateFormatted,
          volunteerName: user?.full_name || 'कार्यकर्ता',
          language: receiptLang,
        });
      } else {
        // Offline flow: use local allocation counter + client UUID
        const clientId = crypto.randomUUID();
        const prefix = allocation?.receipt_prefix || activeMandal?.receipt_prefix || 'G';
        const nextNum = allocation ? allocation.current_number : 1;
        const offlineReceiptNo = `${prefix}-${String(nextNum).padStart(3, '0')}`;

        await enqueueOfflineDonation({
          client_id: clientId,
          mandal_id: activeMandal!.id,
          volunteer_id: user!.id,
          receipt_number: offlineReceiptNo,
          donor_name: donorName.trim(),
          donor_phone: donorPhone.trim() || undefined,
          amount: amount,
          payment_mode: paymentMode,
          payment_reference: paymentRef.trim() || undefined,
          flat_wing: flatWing.trim() || undefined,
          language: receiptLang,
          created_at: new Date().toISOString(),
          sync_status: 'PENDING_SYNC',
        });

        if (allocation) {
          setAllocation({ ...allocation, current_number: nextNum + 1 });
        }

        setGeneratedDonation({
          receiptNumber: offlineReceiptNo,
          donorName: donorName.trim(),
          donorPhone: donorPhone.trim(),
          amount: amount,
          paymentMode: paymentMode,
          flatWing: flatWing.trim(),
          date: dateFormatted,
          volunteerName: user?.full_name || 'कार्यकर्ता',
          language: receiptLang,
        });
      }

      // Reset form fields for next entry (target <10s)
      setDonorName('');
      setDonorPhone('');
      setFlatWing('');
      setPaymentRef('');
      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to record donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetAmounts = activeMandal?.preset_amounts || [101, 251, 501, 1001, 2101, 5001];

  return (
    <AuthGuard allowedRoles={[Role.ADMIN, Role.TREASURER]}>
      <div className="min-h-screen flex flex-col bg-[#FAF9F6] pb-24">
      <Header />
      <OfflineBanner />

      <main className="max-w-md mx-auto w-full px-4 pt-4 flex-1">
        {/* Quick Top Navigation & Info */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 text-xs font-semibold text-[#6B6459] hover:text-[#292118] bg-white hover:bg-[#F3F1EC] px-2.5 py-1 rounded-lg border border-[#E5E1D8] shadow-2xs transition"
          >
            <ArrowLeft className="w-4 h-4 text-[#F97316]" />
            <span>मागे (Back)</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7C2D12]">
            <Sparkles className="w-4 h-4 text-[#F97316]" />
            <span>{activeMandal?.name || 'मंडळ'}</span>
          </div>

          {allocation && (
            <span className="text-[11px] font-medium text-[#6B6459] bg-[#F3F1EC] px-2 py-0.5 rounded-md border border-[#E5E1D8]">
              पावती क्र. सुरू: <strong>{allocation.receipt_prefix}-{allocation.current_number}</strong>
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Minimal High-Speed Entry Form */}
        <Card variant="default" padding="md" className="shadow-md border border-[#E5E1D8]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Donor Name (Single most important field) */}
            <Input
              label={t.donor_name}
              placeholder="उदा. आनंद जोशी / मे. शर्मा"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              autoFocus
              required
            />

            {/* Quick Amount Chips */}
            <div className="space-y-1.5 text-left">
              <label className="text-sm font-medium text-[#292118] flex items-center justify-between">
                <span>{t.amount}</span>
                <span className="text-xs font-bold text-[#F97316]">₹{amount}</span>
              </label>
              <AmountChips
                amounts={presetAmounts}
                selectedAmount={amount}
                onSelect={handleAmountChipSelect}
              />
            </div>

            {/* Custom Amount / Flat Details */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="इतर रक्कम (₹)"
                type="number"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                leftIcon={<IndianRupee className="w-4 h-4" />}
                required
              />
              <Input
                label="फ्लॅट/विंग (ऐच्छिक)"
                placeholder="A-302"
                value={flatWing}
                onChange={(e) => setFlatWing(e.target.value)}
                leftIcon={<Home className="w-4 h-4" />}
              />
            </div>

            {/* Donor Mobile for Instant WhatsApp Receipt */}
            <Input
              label={t.donor_phone}
              type="tel"
              maxLength={10}
              placeholder="9822012345 (व्हॉट्सॲप साठी)"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value.replace(/\D/g, ''))}
              leftIcon={<Phone className="w-4 h-4" />}
            />

            {/* Payment Mode Selector */}
            <div className="space-y-1.5 text-left">
              <label className="text-sm font-medium text-[#292118]">{t.payment_mode}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode(PaymentMode.CASH)}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 font-bold text-xs sm:text-sm transition select-none min-h-[48px] ${
                    paymentMode === PaymentMode.CASH
                      ? 'border-[#16A34A] bg-emerald-50 text-emerald-800'
                      : 'border-[#E5E1D8] bg-white text-[#6B6459] hover:bg-[#F3F1EC]'
                  }`}
                >
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span>{t.cash}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode(PaymentMode.UPI)}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 font-bold text-xs sm:text-sm transition select-none min-h-[48px] ${
                    paymentMode === PaymentMode.UPI
                      ? 'border-[#2563EB] bg-blue-50 text-blue-800'
                      : 'border-[#E5E1D8] bg-white text-[#6B6459] hover:bg-[#F3F1EC]'
                  }`}
                >
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span>{t.upi}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode(PaymentMode.PENDING)}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 font-bold text-xs sm:text-sm transition select-none min-h-[48px] ${
                    paymentMode === PaymentMode.PENDING
                      ? 'border-[#D97706] bg-amber-50 text-amber-900'
                      : 'border-[#E5E1D8] bg-white text-[#6B6459] hover:bg-[#F3F1EC]'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{t.pending || 'Pending'}</span>
                </button>
              </div>
            </div>

            {/* UPI QR Display & Reference / UTR */}
            {paymentMode === PaymentMode.UPI && (
              <div className="space-y-4 pt-1">
                {/* Prominent Scannable UPI QR Box */}
                <div className="p-4 bg-gradient-to-b from-blue-50/90 to-indigo-50/60 rounded-2xl border-2 border-blue-200 shadow-sm text-center">
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-blue-200/70">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-900 text-left">
                      <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        {activeMandal?.upi_qr_url
                          ? 'मंडळाचा अधिकृत UPI QR कोड'
                          : 'UPI द्वारे स्कॅन करून भरा (Scan & Pay)'}
                      </span>
                    </div>
                    <div className="bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                      ₹{amount}
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="my-2.5 flex flex-col items-center justify-center">
                    <div className="p-2.5 bg-white rounded-2xl border-2 border-blue-300 shadow-md inline-block">
                      {activeMandal?.upi_qr_url ? (
                        /* Display Admin Uploaded QR Code */
                        <img
                          src={activeMandal.upi_qr_url}
                          alt="Mandal Official Uploaded QR Code"
                          className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
                        />
                      ) : dynamicUpiQr ? (
                        /* Fallback: Auto-Generated Dynamic QR Code */
                        <img
                          src={dynamicUpiQr}
                          alt="UPI Payment QR Code"
                          className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
                        />
                      ) : (
                        <div className="w-48 h-48 flex flex-col items-center justify-center bg-gray-50 rounded-xl text-xs text-gray-400">
                          <QrCode className="w-10 h-10 mb-1 animate-pulse text-blue-400" />
                          <span>QR कोड लोड होत आहे...</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs font-extrabold text-blue-950">
                        {activeMandal?.name || 'मंडळ'}
                      </p>
                      {activeMandal?.upi_qr_url && (
                        <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ ॲडमिनने अपलोड केलेला अधिकृत QR कोड
                        </span>
                      )}
                      <p className="text-[10px] text-blue-700 font-medium">
                        Google Pay • PhonePe • Paytm • BHIM द्वारे स्कॅन करा
                      </p>
                    </div>
                  </div>

                  {/* Quick Upload CTA for Admin if no custom QR is uploaded yet */}
                  {!activeMandal?.upi_qr_url && role === Role.ADMIN && (
                    <div className="mt-2 pt-2 border-t border-blue-200/60">
                      <Link
                        href="/settings"
                        className="inline-flex items-center gap-1 text-[11px] text-orange-600 font-bold hover:underline bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                        <span>मंडळाचा स्वतःचा QR कोड अपलोड करण्यासाठी येथे क्लिक करा (Settings)</span>
                      </Link>
                    </div>
                  )}

                  {/* UPI ID & Copy Row */}
                  {(activeMandal?.upi_id || (!activeMandal?.upi_qr_url && 'shivneri@upi')) && (
                    <div className="mt-2 pt-2 border-t border-blue-200/60 flex items-center justify-between bg-white/90 px-3 py-1.5 rounded-xl border border-blue-200/80">
                      <div className="text-left overflow-hidden mr-2">
                        <span className="text-[10px] text-[#6B6459] font-medium block leading-none">UPI ID:</span>
                        <span className="text-xs font-extrabold text-[#292118] truncate block">
                          {activeMandal?.upi_id || 'shivneri@upi'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpiId}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition shrink-0 cursor-pointer active:scale-95"
                      >
                        {isUpiCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">कॉपी झाले!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-blue-600" />
                            <span>कॉपी</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* UTR / Reference Input */}
                <Input
                  label="UPI Reference / UTR नंबर (ऐच्छिक)"
                  placeholder="उदा. 4239812903"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </div>
            )}

            {/* Receipt Language Selector */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-[#6B6459]">पावतीची भाषा (Receipt Language)</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { lang: Language.MARATHI, label: 'मराठी' },
                  { lang: Language.ENGLISH, label: 'English' },
                ].map((item) => (
                  <button
                    key={item.lang}
                    type="button"
                    onClick={() => setReceiptLang(item.lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      receiptLang === item.lang
                        ? 'bg-orange-50 border-[#F97316] text-[#F97316]'
                        : 'bg-white border-[#E5E1D8] text-[#6B6459] hover:bg-[#F3F1EC]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Submit Button (Thumb zone) */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                className="font-extrabold text-lg shadow-lg shadow-orange-500/30 min-h-[54px]"
              >
                <span>{t.save_and_generate}</span>
              </Button>
            </div>
          </form>
        </Card>
      </main>

      {/* Instant Digital Receipt Modal */}
      <ReceiptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        donation={generatedDonation}
        mandal={activeMandal}
      />

      {/* Fixed Bottom Navigation for Mobile */}
      <BottomNav
        activeId="collect"
        items={[
          { id: 'collect', label: t.collect, icon: PlusCircle, href: '/collect' },
          { id: 'totals', label: t.my_totals, icon: Wallet, href: '/totals' },
          { id: 'history', label: t.history, icon: Receipt, href: '/history' },
        ]}
        onSelect={(_id, href) => {
          if (href) router.push(href);
        }}
      />
    </div>
    </AuthGuard>
  );
}
