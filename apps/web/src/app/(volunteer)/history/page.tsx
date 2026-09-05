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

  const [filterTab, setFilterTab] = useState<'ALL' | 'CASH' | 'UPI' | 'PENDING'>('ALL');

  const totalCollected = donations.reduce(
    (sum, d) => sum + (d.is_voided || d.payment_mode === 'PENDING' ? 0 : parseFloat(d.amount || 0)),
    0
  );
  const pendingDonations = donations.filter((d) => d.payment_mode === 'PENDING' && !d.is_voided);
  const totalPending = pendingDonations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

  const filteredDonations = donations.filter((d) => {
    if (filterTab === 'ALL') return true;
    return d.payment_mode === filterTab;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] pb-24">
      <Header />
      <OfflineBanner />

      <main className="max-w-md mx-auto w-full px-4 pt-4 flex-1 space-y-4">
        {/* Top Header & Donor Summary Cards */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_20px_-4px_rgba(41,33,24,0.05)] space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#C2410C] flex items-center justify-center border border-orange-200/60">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#292118] leading-tight">
                  देणगीदार संकलन नोंदवही
                </h2>
                <span className="text-[11px] text-[#6B6459]">Mandal Collection Register</span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#7C2D12] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200/70">
              {donations.length} पावत्या
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#E5E1D8]/60">
            <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E5E1D8]/80">
              <span className="text-[#6B6459] font-medium text-[11px] block">एकूण जमा (Received)</span>
              <span className="text-base font-black text-[#7C2D12] mt-0.5 block tabular-nums">
                ₹{totalCollected.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E5E1D8]/80">
              <span className="text-[#6B6459] font-medium text-[11px] block">येणे वर्गणी (Pending)</span>
              <span className="text-base font-black text-amber-700 mt-0.5 block tabular-nums">
                ₹{totalPending.toLocaleString('en-IN')}
                <span className="text-[10px] font-semibold text-[#8C857B] ml-1">({pendingDonations.length})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
          {[
            { id: 'ALL', label: `सर्व (${donations.length})` },
            { id: 'CASH', label: `रोख (${donations.filter((d) => d.payment_mode === 'CASH').length})` },
            { id: 'UPI', label: `UPI (${donations.filter((d) => d.payment_mode === 'UPI').length})` },
            { id: 'PENDING', label: `येणे (${pendingDonations.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                filterTab === tab.id
                  ? 'bg-[#7C2D12] text-white border-[#7C2D12] shadow-2xs'
                  : 'bg-white text-[#6B6459] border-[#E5E1D8] hover:bg-[#FAF9F6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredDonations.length === 0 && !isLoading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#E5E1D8]/80 p-6 shadow-2xs">
            <Receipt className="w-10 h-10 text-[#A8A297] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#292118]">कोणत्याही नोंदी आढळल्या नाहीत</p>
            <p className="text-xs text-[#6B6459] mt-1">निवडलेल्या फिल्टरनुसार नोंदी उपलब्ध नाहीत.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDonations.map((d) => {
              const isCash = d.payment_mode === 'CASH';
              return (
                <div
                  key={d.id}
                  className={`bg-white rounded-2xl p-4 border transition-all duration-200 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(41,33,24,0.07)] ${
                    d.is_voided ? 'opacity-60 bg-gray-50 border-gray-200' : 'border-[#E5E1D8]/80 hover:border-[#D6D0C4]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E5E1D8]/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#7C2D12] bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200/70">
                        {d.receipt_number}
                      </span>
                      {d.is_voided && <StatusBadge status="error" label="रद्द" size="sm" />}
                      {!d.is_voided && d.payment_mode === 'PENDING' && <StatusBadge status="warning" label="येणे वर्गणी" size="sm" />}
                      {!d.is_voided && isCash && d.is_reconciled && <StatusBadge status="success" label="जमा" size="sm" />}
                      {!d.is_voided && isCash && !d.is_reconciled && <StatusBadge status="warning" label="रोख शिल्लक" size="sm" />}
                      {!d.is_voided && d.payment_mode === 'UPI' && <StatusBadge status="info" label="UPI" size="sm" />}
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-[#7C2D12] tabular-nums">
                        ₹{parseFloat(d.amount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#E5E1D8]/70 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#292118] text-sm">{d.donor_name}</span>
                      <span className="text-[11px] font-semibold text-[#6B6459] bg-white px-2 py-0.5 rounded border border-[#E5E1D8]">
                        {PAYMENT_MODE_MAP[d.payment_mode] || d.payment_mode}
                      </span>
                    </div>
                    {d.donor_phone && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6B6459]">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>मोबाईल: <strong className="text-[#292118]">+91 {d.donor_phone}</strong></span>
                      </div>
                    )}
                    {d.flat_wing && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6B6459]">
                        <Home className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>फ्लॅट/विंग: <strong className="text-[#292118]">{d.flat_wing}</strong></span>
                      </div>
                    )}
                    {d.volunteer_name && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6B6459]">
                        <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>नोंदणीकर्ता: <strong className="text-[#292118]">{d.volunteer_name}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8C857B] pt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#A8A297] shrink-0" />
                      <span>{new Date(d.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {!d.is_voided && (
                    <div className="mt-3 pt-2.5 border-t border-[#E5E1D8]/60 flex flex-wrap justify-end gap-2">
                      {d.payment_mode === 'PENDING' && (
                        <button
                          onClick={() => handleOpenCollect(d)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition min-h-[36px] shadow-xs cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>वर्गणी जमा करा</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleViewReceipt(d)}
                        className="px-3.5 py-1.5 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#292118] bg-white hover:bg-[#FAF9F6] flex items-center gap-1.5 transition min-h-[36px] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#6B6459]" />
                        <span>पावती पहा</span>
                      </button>
                      {d.donor_phone && (
                        <button
                          onClick={() => handleShareWhatsApp(d)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold flex items-center gap-1.5 transition min-h-[36px] shadow-xs cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>व्हॉट्सॲप</span>
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

      {collectingDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E5E1D8] shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-[#E5E1D8]">
              <div>
                <h3 className="text-base font-extrabold text-[#292118] flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-600" />
                  <span>येणे वर्गणी जमा करा</span>
                </h3>
                <p className="text-xs text-[#6B6459] mt-0.5">देणगीदाराकडून आलेली रक्कम जमा निश्चित करा</p>
              </div>
              <button onClick={() => setCollectingDonation(null)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E5E1D8] space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B6459]">देणगीदार:</span>
                <span className="font-bold text-[#292118]">{collectingDonation.donor_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#6B6459]">पावती क्र:</span>
                <span className="font-mono font-bold text-[#7C2D12]">{collectingDonation.receipt_number}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-1 border-t border-[#E5E1D8]/60">
                <span className="font-bold text-[#292118]">रक्कम:</span>
                <span className="text-lg font-black text-[#7C2D12] tabular-nums">
                  ₹{parseFloat(collectingDonation.amount).toLocaleString('en-IN')}/-
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#292118] block">भरणा प्रकार निवडा (Choose Mode)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCollectPaymentMode('UPI')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    collectPaymentMode === 'UPI'
                      ? 'bg-orange-50 border-[#C2410C] text-[#C2410C] font-bold shadow-xs'
                      : 'bg-[#FAF9F6] border-[#E5E1D8] text-[#6B6459]'
                  }`}
                >
                  <QrCode className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs block">UPI द्वारे</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCollectPaymentMode('CASH')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    collectPaymentMode === 'CASH'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold shadow-xs'
                      : 'bg-[#FAF9F6] border-[#E5E1D8] text-[#6B6459]'
                  }`}
                >
                  <Wallet className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs block font-bold">रोख (Cash)</span>
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
