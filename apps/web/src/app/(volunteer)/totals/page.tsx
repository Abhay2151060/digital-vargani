'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { AuthGuard } from '../../../components/AuthGuard';
import { Role } from '@vargani/types';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { Card, Button, BottomNav } from '@vargani/ui';
import { apiRequest } from '../../../lib/api-client';
import { getT } from '../../../lib/i18n';
import { Wallet, IndianRupee, QrCode, PlusCircle, Receipt, ArrowRight, ShieldCheck } from 'lucide-react';

export default function VolunteerTotalsPage() {
  const { user, activeMandal, role, language } = useAuth();
  const t = getT(language);
  const router = useRouter();

  const [donations, setDonations] = useState<any[]>([]);
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeMandal && user && (role === Role.ADMIN || role === Role.TREASURER)) {
      apiRequest<any[]>(`/donations?volunteerId=${user.id}`)
        .then(setDonations)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [activeMandal, user, role]);

  const todayDonations = donations.filter((d) => {
    const dDate = new Date(d.created_at).toDateString();
    return dDate === new Date().toDateString() && !d.is_voided;
  });

  const todayCash = todayDonations
    .filter((d) => d.payment_mode === 'CASH')
    .reduce((sum, d) => sum + parseFloat(d.amount), 0);

  const todayUpi = todayDonations
    .filter((d) => d.payment_mode === 'UPI')
    .reduce((sum, d) => sum + parseFloat(d.amount), 0);

  const totalUnreconciledCash = donations
    .filter((d) => d.payment_mode === 'CASH' && !d.is_reconciled && !d.is_voided)
    .reduce((sum, d) => sum + parseFloat(d.amount), 0);

  const totalReconciledCash = donations
    .filter((d) => d.payment_mode === 'CASH' && d.is_reconciled && !d.is_voided)
    .reduce((sum, d) => sum + parseFloat(d.amount), 0);

  return (
    <AuthGuard allowedRoles={[Role.ADMIN, Role.TREASURER]}>
      <div className="min-h-screen flex flex-col bg-[#FAF9F6] pb-24">
      <Header />
      <OfflineBanner />

      <main className="max-w-md mx-auto w-full px-4 pt-4 flex-1 space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-extrabold text-[#292118]">{t.my_totals}</h2>
          <span className="text-xs font-semibold text-[#6B6459]">{user?.full_name}</span>
        </div>

        {/* Big Cash In Hand Card */}
        <div className="bg-gradient-to-br from-white to-[#FFF7ED] rounded-3xl p-5 border border-[#FDBA74]/80 shadow-[0_8px_30px_rgba(194,65,12,0.06)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center border border-orange-200">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#7C2D12]">
                {t.cash_in_hand}
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              हस्तांतरण बाकी
            </span>
          </div>

          <div>
            <p className="text-3xl sm:text-4xl font-black text-[#7C2D12] tabular-nums">
              ₹{totalUnreconciledCash.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-[#6B6459] mt-1 font-medium">
              खजिनदारांकडे जमा करण्यासाठी शिल्लक रोख रक्कम
            </p>
          </div>
        </div>

        {/* Today's Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              <span>आजची रोख</span>
            </div>
            <p className="text-xl font-bold text-[#292118] tabular-nums">
              ₹{todayCash.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-[#6B6459] mt-0.5">
              {todayDonations.filter((d) => d.payment_mode === 'CASH').length} पावत्या
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 mb-1">
              <QrCode className="w-3.5 h-3.5 text-sky-600" />
              <span>आजचे UPI</span>
            </div>
            <p className="text-xl font-bold text-[#292118] tabular-nums">
              ₹{todayUpi.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-[#6B6459] mt-0.5">
              {todayDonations.filter((d) => d.payment_mode === 'UPI').length} पावत्या
            </p>
          </div>
        </div>

        {/* Reconciled Stats */}
        <div className="bg-white rounded-2xl p-3.5 border border-[#E5E1D8]/80 flex items-center justify-between text-xs text-[#6B6459] shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>पूर्वी जमा झालेली रोख (Reconciled):</span>
          </div>
          <strong className="text-emerald-700 font-bold tabular-nums">₹{totalReconciledCash.toLocaleString('en-IN')}</strong>
        </div>

        {/* CTA to collect - Only visible to Treasurer */}
        {role === Role.TREASURER && (
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push('/collect')}
              className="font-bold gap-2 rounded-2xl cursor-pointer"
            >
              <span>नवीन पावती बनवा</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      <BottomNav
        activeId="totals"
        items={
          role === Role.TREASURER
            ? [
                { id: 'collect', label: t.collect, icon: PlusCircle, href: '/collect' },
                { id: 'totals', label: t.my_totals, icon: Wallet, href: '/totals' },
                { id: 'history', label: t.history, icon: Receipt, href: '/history' },
              ]
            : [
                { id: 'totals', label: t.my_totals, icon: Wallet, href: '/totals' },
                { id: 'history', label: t.history, icon: Receipt, href: '/history' },
              ]
        }
        onSelect={(_id, href) => {
          if (href) router.push(href);
        }}
      />
    </div>
    </AuthGuard>
  );
}
