'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { ReceiptModal } from '../../../components/ReceiptModal';
import { StatusBadge, BottomNav } from '@vargani/ui';
import { apiRequest } from '../../../lib/api-client';
import { getT } from '../../../lib/i18n';
import { generateWhatsAppShareUrl } from '../../../lib/whatsapp';
import { PlusCircle, Wallet, Receipt, Share2, Eye, User, Phone, Home, Calendar, Users, QrCode, CheckCircle2, X, Clock } from 'lucide-react';
import { Language, Role, PaymentMode } from '@vargani/types';

export default function VolunteerHistoryPage() {
  const { user, role, activeMandal, language } = useAuth();
  const t = getT(language);
  const router = useRouter();

  const [donations, setDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Collect Pending Donation Modal State
  const [collectingDonation, setCollectingDonation] = useState<any | null>(null);
  const [collectPaymentMode, setCollectPaymentMode] = useState<'UPI' | 'CASH'>('UPI');
  const [collectPaymentRef, setCollectPaymentRef] = useState('');
  const [isSubmittingCollect, setIsSubmittingCollect] = useState(false);
  const [collectError, setCollectError] = useState('');

  const fetchDonations = () => {
    if (activeMandal && user) {
      apiRequest<any[]>('/donations')
        .then(setDonations)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [activeMandal, user]);

  const handleOpenCollect = (d: any) => {
    setCollectingDonation(d);
    setCollectPaymentMode('UPI');
    setCollectPaymentRef('');
    setCollectError('');
  };

  const handleConfirmCollect = async () => {
    if (!collectingDonation) return;
    try {
      setIsSubmittingCollect(true);
      setCollectError('');
      const updated = await apiRequest<any>('/donations/collect-pending', {
        method: 'POST',
        body: JSON.stringify({
          donation_id: collectingDonation.id,
          payment_mode: collectPaymentMode,
          payment_reference: collectPaymentMode === 'UPI' ? collectPaymentRef.trim() || undefined : undefined,
        }),
      });

      // Update state locally
      setDonations((prev) =>
        prev.map((item) => (item.id === collectingDonation.id ? { ...item, ...updated, payment_mode: collectPaymentMode } : item))
      );
      setCollectingDonation(null);
      fetchDonations();
    } catch (err: any) {
      console.error('Failed to collect donation:', err);
      setCollectError(err.message || 'वर्गणी जमा करण्यात त्रुटी आली.');
    } finally {
      setIsSubmittingCollect(false);
    }
  };

  const PAYMENT_MODE_MAP: Record<string, string> = {
    CASH: 'Cash (रोख)',
    UPI: 'UPI (यूपीआय)',
    PENDING: 'Pending (प्रलंबित)',
  };

  const handleShareWhatsApp = (d: any) => {
    const url = generateWhatsAppShareUrl({
      donorPhone: d.donor_phone || '',
      donorName: d.donor_name,
      mandalName: activeMandal?.name || 'मंडळ',
      mandalSlug: activeMandal?.slug || '',
      receiptNumber: d.receipt_number,
      amount: parseFloat(d.amount),
      paymentMode: d.payment_mode,
      date: new Date(d.created_at).toLocaleDateString('en-IN'),
      language: d.language || Language.MARATHI,
    });
    window.open(url, '_blank');
  };

  const handleViewReceipt = (d: any) => {
    setSelectedDonation({
      receiptNumber: d.receipt_number,
      donorName: d.donor_name,
      donorPhone: d.donor_phone,
      amount: parseFloat(d.amount),
      paymentMode: d.payment_mode,
      flatWing: d.flat_wing,
      date: new Date(d.created_at).toLocaleDateString('en-IN'),
      volunteerName: user?.full_name || 'कार्यकर्ता',
      language: d.language || Language.MARATHI,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] pb-24">
      <Header />
      <OfflineBanner />

      <main className="max-w-md mx-auto w-full px-4 pt-4 flex-1 space-y-4">
        {/* Top Header & Donor Summary */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-2xs space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-extrabold text-[#292118] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#F97316]" />
              <span>देणगीदार माहिती (Donor Details)</span>
            </h2>
            <span className="text-xs font-bold text-[#F97316] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
              {donations.length} देणगीदार (Donors)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#E5E1D8]/60">
            <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E5E1D8]">
              <span className="text-[#6B6459] font-medium block">एकूण नोंदी</span>
              <span className="text-base font-black text-[#292118] mt-0.5 block">{donations.length} पावत्या</span>
            </div>
            <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E5E1D8]">
              <span className="text-[#6B6459] font-medium block">एकूण जमा</span>
              <span className="text-base font-black text-[#7C2D12] mt-0.5 block">
                ₹{donations.reduce((sum, d) => sum + (d.is_voided ? 0 : parseFloat(d.amount || 0)), 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {donations.length === 0 && !isLoading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#E5E1D8] p-6">
            <Receipt className="w-12 h-12 text-[#A8A297] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#292118]">अद्याप कोणतीही पावती नोंदवलेली नाही</p>
            <p className="text-xs text-[#6B6459] mt-1">आपण नोंदवलेल्या देणगीदारांची माहिती येथे दिसेल.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {donations.map((d) => {
              const isCash = d.payment_mode === 'CASH';
              return (
                <div
                  key={d.id}
                  className={`bg-white rounded-2xl p-4 border transition shadow-xs ${
                    d.is_voided ? 'opacity-60 bg-gray-50 border-gray-200' : 'border-[#E5E1D8]'
                  }`}
                >
                  {/* Top Status & Receipt Header */}
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E5E1D8]/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#F97316] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        {d.receipt_number}
                      </span>
                      {d.is_voided && (
                        <StatusBadge status="error" label="रद्द (Voided)" size="sm" />
                      )}
                      {!d.is_voided && d.payment_mode === 'PENDING' && (
                        <StatusBadge status="warning" label="येणे (Pending)" size="sm" />
                      )}
                      {!d.is_voided && isCash && d.is_reconciled && (
                        <StatusBadge status="success" label="जमा (Reconciled)" size="sm" />
                      )}
                      {!d.is_voided && isCash && !d.is_reconciled && (
                        <StatusBadge status="warning" label="रोख शिल्लक" size="sm" />
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-base font-black text-[#7C2D12]">
                        ₹{parseFloat(d.amount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* देणगीदार माहिती (Donor Details Card Section) */}
                  <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#E5E1D8] space-y-1.5">
                    <div className="text-[11px] font-bold text-[#C2410C] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#F97316]" />
                      <span>देणगीदार माहिती (Donor Details)</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#292118] text-sm">{d.donor_name}</span>
                      <span className="text-[11px] font-semibold text-[#6B6459] bg-[#F3F1EC] px-2 py-0.5 rounded border border-[#E5E1D8]">
                        {PAYMENT_MODE_MAP[d.payment_mode] || d.payment_mode}
                      </span>
                    </div>

                    {d.donor_phone && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6B6459] font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>मोबाईल: <strong>+91 {d.donor_phone}</strong></span>
                      </div>
                    )}

                    {d.flat_wing && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6B6459] font-medium">
                        <Home className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>फ्लॅट/विंग: <strong>{d.flat_wing}</strong></span>
                      </div>
                    )}

                    {d.volunteer_name && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6B6459] font-medium">
                        <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>नोंदणीकर्ता: <strong>{d.volunteer_name}</strong></span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] text-[#8C857B] pt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#A8A297] shrink-0" />
                      <span>
                        {new Date(d.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {!d.is_voided && (
                    <div className="mt-3 pt-3 border-t border-[#E5E1D8]/60 flex flex-wrap justify-end gap-2">
                      {d.payment_mode === 'PENDING' && (
                        <button
                          onClick={() => handleOpenCollect(d)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition min-h-[36px] shadow-xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>वर्गणी जमा करा (Collect)</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleViewReceipt(d)}
                        className="px-3 py-1.5 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#292118] hover:bg-[#F3F1EC] flex items-center gap-1.5 transition min-h-[36px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>पावती पहा</span>
                      </button>

                      {d.donor_phone && (
                        <button
                          onClick={() => handleShareWhatsApp(d)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition min-h-[36px]"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>व्हॉट्सॲप </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal to Collect Pending Donation */}
      {collectingDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E5E1D8] shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E1D8]">
              <div>
                <h3 className="text-base font-extrabold text-[#292118] flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-600" />
                  <span>येणे वर्गणी जमा करा (Add Collection)</span>
                </h3>
                <p className="text-xs text-[#6B6459] mt-0.5">देणगीदाराकडून आलेली रक्कम जमा निश्चित करा</p>
              </div>
              <button
                onClick={() => setCollectingDonation(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Donor Quick Summary */}
            <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E5E1D8] space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B6459]">देणगीदार:</span>
                <span className="font-bold text-[#292118]">{collectingDonation.donor_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B6459]">पावती क्र:</span>
                <span className="font-semibold text-orange-600">{collectingDonation.receipt_number}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-1 border-t border-[#E5E1D8]/60">
                <span className="font-bold text-[#292118]">रक्कम:</span>
                <span className="text-lg font-black text-[#7C2D12]">
                  ₹{parseFloat(collectingDonation.amount).toLocaleString('en-IN')}/-
                </span>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#292118] block">भरणा प्रकार निवडा (Choose Payment Mode)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCollectPaymentMode('UPI')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 font-bold text-xs transition ${
                    collectPaymentMode === 'UPI'
                      ? 'border-[#2563EB] bg-blue-50 text-blue-900 shadow-xs'
                      : 'border-[#E5E1D8] bg-white text-[#6B6459] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <QrCode className="w-5 h-5 mb-1 text-[#2563EB]" />
                  <span>Collect via UPI</span>
                  <span className="text-[10px] font-normal text-blue-700 mt-0.5">(यूपीआय द्वारे)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCollectPaymentMode('CASH')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 font-bold text-xs transition ${
                    collectPaymentMode === 'CASH'
                      ? 'border-[#16A34A] bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-[#E5E1D8] bg-white text-[#6B6459] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <Wallet className="w-5 h-5 mb-1 text-[#16A34A]" />
                  <span>Collect via Cash</span>
                  <span className="text-[10px] font-normal text-emerald-700 mt-0.5">(रोख द्वारे)</span>
                </button>
              </div>
            </div>

            {/* UPI Reference Input */}
            {collectPaymentMode === 'UPI' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#6B6459]">UPI Reference / UTR No. (ऐच्छिक)</label>
                <input
                  type="text"
                  placeholder="उदा. 4239812903"
                  value={collectPaymentRef}
                  onChange={(e) => setCollectPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {collectError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                {collectError}
              </p>
            )}

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCollectingDonation(null)}
                disabled={isSubmittingCollect}
                className="flex-1 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-bold text-[#6B6459] hover:bg-[#FAF9F6]"
              >
                रद्द करा (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmCollect}
                disabled={isSubmittingCollect}
                className="flex-1 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmittingCollect ? 'जमा होत आहे...' : 'जमा निश्चित करा (Confirm)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ReceiptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        donation={selectedDonation}
        mandal={activeMandal}
      />

      <BottomNav
        activeId="history"
        items={
          role === Role.TREASURER
            ? [
                { id: 'collect', label: t.collect, icon: PlusCircle, href: '/collect' },
                { id: 'totals', label: t.my_totals, icon: Wallet, href: '/totals' },
                { id: 'history', label: t.history, icon: Receipt, href: '/history' },
              ]
            : role === Role.ADMIN
            ? [
                { id: 'totals', label: t.my_totals, icon: Wallet, href: '/totals' },
                { id: 'history', label: t.history, icon: Receipt, href: '/history' },
              ]
            : [{ id: 'history', label: t.history, icon: Receipt, href: '/history' }]
        }
        onSelect={(_id, href) => {
          if (href) router.push(href);
        }}
      />
    </div>
  );
}
