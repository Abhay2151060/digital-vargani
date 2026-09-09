'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { ReceiptModal } from '../../../components/ReceiptModal';
import { CollectPendingModal } from '../../../components/CollectPendingModal';
import { StatusBadge, BottomNav } from '@vargani/ui';
import { apiRequest } from '../../../lib/api-client';
import { getT } from '../../../lib/i18n';
import { generateWhatsAppShareUrl } from '../../../lib/whatsapp';
import { PlusCircle, Wallet, Receipt, Share2, Eye, User, Phone, Home, Calendar, Users, QrCode, CheckCircle2, X, Clock } from 'lucide-react';
import { Language, Role, PaymentMode } from '@vargani/types';
import { formatDisplayName } from '../../../lib/format';

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

  const PAYMENT_MODE_MAP: Record<string, string> = {
    CASH: t.cash,
    UPI: t.upi,
    PENDING: t.pending,
  };

  const handleShareWhatsApp = (d: any) => {
    const url = generateWhatsAppShareUrl({
      donorPhone: d.donor_phone || '',
      donorName: d.donor_name,
      mandalName: activeMandal?.name || (language === Language.ENGLISH ? 'Mandal' : 'मंडळ'),
      mandalSlug: activeMandal?.slug || '',
      receiptNumber: d.receipt_number,
      amount: parseFloat(d.amount),
      paymentMode: d.payment_mode,
      date: new Date(d.created_at).toLocaleDateString(language === Language.ENGLISH ? 'en-IN' : 'mr-IN'),
      language: d.language || language,
    });
    window.open(url, '_blank');
  };

  const handleViewReceipt = (d: any) => {
    const tot = parseFloat(d.amount);
    const paid = d.total_paid != null ? parseFloat(d.total_paid) : (d.payment_mode !== 'PENDING' ? tot : 0);
    const rem = d.remaining_amount != null ? parseFloat(d.remaining_amount) : (d.payment_mode === 'PENDING' ? tot : 0);
    const status = d.payment_status || (rem <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING');

    setSelectedDonation({
      receiptNumber: d.receipt_number,
      donorName: d.donor_name,
      donorPhone: d.donor_phone,
      amount: tot,
      totalPaid: paid,
      remainingAmount: rem,
      paymentStatus: status,
      payments: d.payments || [],
      paymentMode: d.payment_mode,
      flatWing: d.flat_wing,
      date: new Date(d.created_at).toLocaleDateString(language === Language.ENGLISH ? 'en-IN' : 'mr-IN'),
      volunteerName: formatDisplayName(user?.full_name) || (role === Role.ADMIN ? t.admin_role : role === Role.TREASURER ? t.treasurer_role : t.volunteer_role),
      language: d.language || language,
    });
    setIsModalOpen(true);
  };

  const [filterTab, setFilterTab] = useState<'ALL' | 'CASH' | 'UPI' | 'PARTIAL' | 'PENDING'>('ALL');

  const totalCollected = donations.reduce(
    (sum, d) => sum + (d.is_voided || d.payment_mode === 'PENDING' ? 0 : parseFloat(d.total_paid ?? d.amount ?? 0)),
    0
  );
  const pendingDonations = donations.filter((d) => (d.payment_mode === 'PENDING' || d.payment_status === 'PENDING') && !d.is_voided);
  const partialDonations = donations.filter((d) => (d.payment_status === 'PARTIAL' || (d.remaining_amount != null && parseFloat(d.remaining_amount) > 0 && parseFloat(d.remaining_amount) < parseFloat(d.amount))) && !d.is_voided);
  const totalPending = donations.reduce((sum, d) => {
    if (d.is_voided) return sum;
    if (d.remaining_amount != null) return sum + parseFloat(d.remaining_amount);
    if (d.payment_mode === 'PENDING') return sum + parseFloat(d.amount || 0);
    return sum;
  }, 0);

  const filteredDonations = donations.filter((d) => {
    if (filterTab === 'ALL') return true;
    if (filterTab === 'PARTIAL') {
      return d.payment_status === 'PARTIAL' || (d.remaining_amount != null && parseFloat(d.remaining_amount) > 0 && parseFloat(d.remaining_amount) < parseFloat(d.amount));
    }
    if (filterTab === 'PENDING') {
      return d.payment_mode === 'PENDING' || d.payment_status === 'PENDING';
    }
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
                  {t.mandal_collection_register}
                </h2>
              </div>
            </div>
            <span className="text-xs font-bold text-[#7C2D12] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200/70">
              {donations.length} {t.receipts_suffix}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-1">
            <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E5E1D8]/80">
              <span className="text-[#6B6459] font-medium text-[11px] block">{t.total_received}</span>
              <span className="text-base font-black text-[#7C2D12] mt-0.5 block tabular-nums">
                ₹{totalCollected.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-[#FAF9F6] p-2.5 rounded-xl border border-[#E5E1D8]/80">
              <span className="text-[#6B6459] font-medium text-[11px] block">{t.pending_collection}</span>
              <span className="text-base font-black text-amber-700 mt-0.5 block tabular-nums">
                ₹{totalPending.toLocaleString('en-IN')}
                <span className="text-[10px] font-semibold text-[#8C857B] ml-1">({pendingDonations.length + partialDonations.length})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
          {[
            { id: 'ALL', label: `${t.all} (${donations.length})` },
            { id: 'CASH', label: `${t.cash} (${donations.filter((d) => d.payment_mode === 'CASH').length})` },
            { id: 'UPI', label: `${t.upi} (${donations.filter((d) => d.payment_mode === 'UPI').length})` },
            { id: 'PARTIAL', label: `अंशतः (${partialDonations.length})` },
            { id: 'PENDING', label: `${t.pending} (${pendingDonations.length})` },
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
            <p className="text-sm font-bold text-[#292118]">{t.no_records_found}</p>
            <p className="text-xs text-[#6B6459] mt-1">{t.no_records_desc}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDonations.map((d) => {
              const isCash = d.payment_mode === 'CASH';
              const tot = parseFloat(d.amount);
              const paid = d.total_paid != null ? parseFloat(d.total_paid) : (d.payment_mode !== 'PENDING' ? tot : 0);
              const rem = d.remaining_amount != null ? parseFloat(d.remaining_amount) : (d.payment_mode === 'PENDING' ? tot : 0);
              const isPartial = (d.payment_status === 'PARTIAL') || (rem > 0 && paid > 0);
              const isPending = d.payment_mode === 'PENDING' || d.payment_status === 'PENDING';

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
                      {d.is_voided && <StatusBadge status="error" label={t.void_status} size="sm" />}
                      {!d.is_voided && isPending && <StatusBadge status="warning" label={t.pending} size="sm" />}
                      {!d.is_voided && isPartial && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          अंशतः जमा
                        </span>
                      )}
                      {!d.is_voided && !isPartial && !isPending && isCash && d.is_reconciled && <StatusBadge status="success" label={t.deposited} size="sm" />}
                      {!d.is_voided && !isPartial && !isPending && isCash && !d.is_reconciled && <StatusBadge status="warning" label={t.cash_balance} size="sm" />}
                      {!d.is_voided && !isPartial && !isPending && d.payment_mode === 'UPI' && <StatusBadge status="info" label={t.upi} size="sm" />}
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-[#7C2D12] tabular-nums">
                        ₹{tot.toLocaleString('en-IN')}
                      </p>
                      {isPartial && (
                        <p className="text-[10px] font-bold text-amber-700">
                          शिल्लक: ₹{rem.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#E5E1D8]/70 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#292118] text-sm">{d.donor_name}</span>
                      <span className="text-[11px] font-semibold text-[#6B6459] bg-white px-2 py-0.5 rounded border border-[#E5E1D8]">
                        {isPartial ? 'अंशतः (Partial)' : (PAYMENT_MODE_MAP[d.payment_mode] || d.payment_mode)}
                      </span>
                    </div>
                    {isPartial && (
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
                        <div className="text-emerald-800 font-semibold">
                          जमा: ₹{paid.toLocaleString('en-IN')}
                        </div>
                        <div className="text-amber-800 font-bold text-right">
                          शिल्लक: ₹{rem.toLocaleString('en-IN')}
                        </div>
                      </div>
                    )}
                    {d.donor_phone && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6B6459]">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{t.mobile}: <strong className="text-[#292118]">+91 {d.donor_phone}</strong></span>
                      </div>
                    )}
                    {d.flat_wing && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6B6459]">
                        <Home className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{t.flat_wing_label}: <strong className="text-[#292118]">{d.flat_wing}</strong></span>
                      </div>
                    )}
                    {d.volunteer_name && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6B6459]">
                        <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{t.recorded_by}: <strong className="text-[#292118]">{d.volunteer_name}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8C857B] pt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#A8A297] shrink-0" />
                      <span>{new Date(d.created_at).toLocaleString(language === Language.ENGLISH ? 'en-IN' : 'mr-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {!d.is_voided && (
                    <div className="mt-3 pt-2.5 border-t border-[#E5E1D8]/60 flex flex-wrap justify-end gap-2">
                      {(isPending || isPartial || rem > 0) && (
                        <button
                          onClick={() => setCollectingDonation(d)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition min-h-[36px] shadow-xs cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{t.collect_vargani}</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleViewReceipt(d)}
                        className="px-3.5 py-1.5 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#292118] bg-white hover:bg-[#FAF9F6] flex items-center gap-1.5 transition min-h-[36px] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#6B6459]" />
                        <span>{t.view_receipt}</span>
                      </button>
                      {d.donor_phone && (
                        <button
                          onClick={() => handleShareWhatsApp(d)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold flex items-center gap-1.5 transition min-h-[36px] shadow-xs cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{t.whatsapp}</span>
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

      {/* Collect Pending Modal */}
      <CollectPendingModal
        isOpen={!!collectingDonation}
        onClose={() => setCollectingDonation(null)}
        donation={collectingDonation}
        onSuccess={(updated) => {
          setDonations((prev) =>
            prev.map((item) =>
              item.id === collectingDonation?.id
                ? { ...item, ...updated, payment_mode: updated.payment_mode }
                : item
            )
          );
          fetchDonations();
        }}
      />

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
