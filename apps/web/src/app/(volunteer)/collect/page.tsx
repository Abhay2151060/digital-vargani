'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { ReceiptModal } from '../../../components/ReceiptModal';
import { Input, Button, Card, AmountChips, BottomNav } from '@vargani/ui';
import { PaymentMode, Language, Role } from '@vargani/types';
import { getT } from '../../../lib/i18n';
import { apiRequest } from '../../../lib/api-client';
import { enqueueOfflineDonation } from '../../../lib/offline-queue';
import { PlusCircle, Wallet, QrCode, IndianRupee, User, Phone, Home, Sparkles, Receipt, ArrowLeft } from 'lucide-react';

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

  // Volunteer's local allocation range
  const [allocation, setAllocation] = useState<any | null>(null);

  useEffect(() => {
    if (activeMandal && token) {
      apiRequest<any>('/donations/my-allocation')
        .then(setAllocation)
        .catch(console.error);
    }
  }, [activeMandal, token]);

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
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode(PaymentMode.CASH)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-sm transition select-none min-h-[48px] ${
                    paymentMode === PaymentMode.CASH
                      ? 'border-[#16A34A] bg-emerald-50 text-emerald-800'
                      : 'border-[#E5E1D8] bg-white text-[#6B6459] hover:bg-[#F3F1EC]'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>{t.cash}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode(PaymentMode.UPI)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-sm transition select-none min-h-[48px] ${
                    paymentMode === PaymentMode.UPI
                      ? 'border-[#2563EB] bg-blue-50 text-blue-800'
                      : 'border-[#E5E1D8] bg-white text-[#6B6459] hover:bg-[#F3F1EC]'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>{t.upi}</span>
                </button>
              </div>
            </div>

            {/* UPI Reference / UTR if applicable */}
            {paymentMode === PaymentMode.UPI && (
              <Input
                label="UPI Reference / UTR (ऐच्छिक)"
                placeholder="उदा. 4239812903"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
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
  );
}
