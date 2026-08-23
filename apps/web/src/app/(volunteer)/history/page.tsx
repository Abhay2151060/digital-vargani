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
import { PlusCircle, Wallet, Receipt, Share2, Eye } from 'lucide-react';
import { Language } from '@vargani/types';

export default function VolunteerHistoryPage() {
  const { user, activeMandal, language } = useAuth();
  const t = getT(language);
  const router = useRouter();

  const [donations, setDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDonations = () => {
    if (activeMandal && user) {
      apiRequest<any[]>(`/donations?volunteerId=${user.id}`)
        .then(setDonations)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [activeMandal, user]);

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
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-extrabold text-[#292118]">{t.history}</h2>
          <span className="text-xs font-semibold text-[#6B6459]">{donations.length} पावत्या</span>
        </div>

        {donations.length === 0 && !isLoading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#E5E1D8] p-6">
            <Receipt className="w-12 h-12 text-[#A8A297] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#292118]">अद्याप कोणतीही पावती नोंदवलेली नाही</p>
            <p className="text-xs text-[#6B6459] mt-1">आपण नोंदवलेल्या सर्व पावत्या येथे दिसतील.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {donations.map((d) => {
              const isCash = d.payment_mode === 'CASH';
              return (
                <div
                  key={d.id}
                  className={`bg-white rounded-2xl p-4 border transition shadow-xs ${
                    d.is_voided ? 'opacity-60 bg-gray-50 border-gray-200' : 'border-[#E5E1D8]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#F97316] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          {d.receipt_number}
                        </span>
                        {d.is_voided && (
                          <StatusBadge status="error" label="रद्द (Voided)" size="sm" />
                        )}
                        {!d.is_voided && isCash && d.is_reconciled && (
                          <StatusBadge status="success" label="जमा (Reconciled)" size="sm" />
                        )}
                        {!d.is_voided && isCash && !d.is_reconciled && (
                          <StatusBadge status="warning" label="रोख शिल्लक" size="sm" />
                        )}
                      </div>
                      <h4 className="font-bold text-base text-[#292118] mt-1.5">{d.donor_name}</h4>
                      <p className="text-xs text-[#6B6459]">
                        {new Date(d.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {d.flat_wing ? ` • ${d.flat_wing}` : ''}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-black text-[#7C2D12]">
                        ₹{parseFloat(d.amount).toLocaleString('en-IN')}
                      </p>
                      <span className="text-[11px] font-semibold text-[#6B6459] bg-[#F3F1EC] px-2 py-0.5 rounded">
                        {d.payment_mode}
                      </span>
                    </div>
                  </div>

                  {!d.is_voided && (
                    <div className="mt-3 pt-3 border-t border-[#E5E1D8]/60 flex justify-end gap-2">
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

      <ReceiptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        donation={selectedDonation}
        mandal={activeMandal}
      />

      <BottomNav
        activeId="history"
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
