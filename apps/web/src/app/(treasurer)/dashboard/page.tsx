'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { Card, Button } from '@vargani/ui';
import { apiRequest, downloadFile } from '../../../lib/api-client';
import { getT } from '../../../lib/i18n';
import { TreasurerOverview, Role, Language } from '@vargani/types';
import Link from 'next/link';
import {
  IndianRupee,
  Wallet,
  TrendingUp,
  Building,
  ArrowUpRight,
  FileSpreadsheet,
} from 'lucide-react';

export default function TreasurerDashboardPage() {
  const { activeMandal, role, language, token } = useAuth();
  const t = getT(language);

  const [overview, setOverview] = useState<TreasurerOverview | null>(null);
  const [, setIsLoading] = useState(true);
  const [isExportingDonations, setIsExportingDonations] = useState(false);
  const [isExportingExpenses, setIsExportingExpenses] = useState(false);

  const fetchOverview = () => {
    if (activeMandal && token) {
      apiRequest<TreasurerOverview>('/reconciliation/overview')
        .then(setOverview)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [activeMandal, token]);

  const handleExportDonations = async () => {
    try {
      setIsExportingDonations(true);
      await downloadFile('/reports/donations/csv', `donations-${Date.now()}.csv`, token);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Export failed');
    } finally {
      setIsExportingDonations(false);
    }
  };

  const handleExportExpenses = async () => {
    try {
      setIsExportingExpenses(true);
      await downloadFile('/reports/expenses/csv', `expenses-${Date.now()}.csv`, token);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Export failed');
    } finally {
      setIsExportingExpenses(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] pb-16">
      <Header />
      <OfflineBanner />

      {/* Treasurer / Admin Navigation Bar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[#E5E1D8]/80 px-4 py-2 sticky top-[53px] z-20 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between overflow-x-auto gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-xl bg-[#7C2D12] text-white font-bold shadow-2xs"
            >
              {t.dashboard}
            </Link>
            <Link
              href="/reconciliation"
              className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118] transition"
            >
              {t.reconciliation}
            </Link>
            <Link
              href="/expenses"
              className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118] transition"
            >
              {t.expenses}
            </Link>
            <Link
              href="/members"
              className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118] transition"
            >
              {t.members}
            </Link>
            <Link
              href="/reports"
              className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118] transition"
            >
              {t.reports}
            </Link>
            {role === Role.ADMIN && (
              <Link
                href="/settings"
                className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118] transition"
              >
                {t.settings}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDonations}
              disabled={isExportingDonations}
              className="text-xs h-8 gap-1.5 rounded-xl cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isExportingDonations ? t.downloading : t.donations_csv}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExpenses}
              disabled={isExportingExpenses}
              className="text-xs h-8 gap-1.5 rounded-xl cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-red-600" />
              <span>{isExportingExpenses ? t.downloading : t.expenses_csv}</span>
            </Button>
            <Link href={`/mandal/${activeMandal?.slug}/transparency`} target="_blank">
              <Button variant="ghost" size="sm" className="text-xs h-8 gap-1 cursor-pointer">
                <span>{t.transparency_portal}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto w-full px-4 pt-6 flex-1 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-[#292118]">
                {activeMandal?.name || 'मंडळ'}
              </h2>
              <span className="text-[10px] font-bold text-[#7C2D12] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/70">
                आर्थिक डॅशबोर्ड
              </span>
            </div>
            <p className="text-xs text-[#6B6459] mt-0.5">
              {language === Language.ENGLISH
                ? 'Live festival collections, approved expenses, and cash reconciliation.'
                : 'थेट उत्सव जमा, खर्च आणि कार्यकर्त्यांकडील रोख रक्कमेचा हिशोब'}
            </p>
          </div>

          {role === Role.TREASURER && (
            <Link href="/collect">
              <Button variant="primary" size="md" className="font-bold gap-1.5 rounded-xl shadow-xs cursor-pointer">
                <span>{t.new_receipt}</span>
              </Button>
            </Link>
          )}
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)] hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#6B6459] uppercase tracking-wider">
                  {t.total_festival_collection}
                </p>
                <p className="text-2xl font-black text-[#7C2D12] mt-1 tabular-nums">
                  ₹{overview?.festival_total_collected.toLocaleString('en-IN') || '0'}
                </p>
              </div>
              <span className="p-2 rounded-xl bg-orange-50 text-[#C2410C] border border-orange-200/60">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-2.5">
              आज जमा: ₹{overview?.today_total_collected.toLocaleString('en-IN') || '0'}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)] hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#6B6459] uppercase tracking-wider">
                  {t.cash_in_hand}
                </p>
                <p className="text-2xl font-black text-amber-700 mt-1 tabular-nums">
                  ₹{overview?.total_cash_in_hand_volunteers.toLocaleString('en-IN') || '0'}
                </p>
              </div>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <Link href="/reconciliation" className="text-[11px] text-[#C2410C] font-bold hover:underline mt-2.5 inline-block">
              हिशोब पडताळणी करा →
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)] hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#6B6459] uppercase tracking-wider">
                  {t.approved_expenses}
                </p>
                <p className="text-2xl font-black text-rose-700 mt-1 tabular-nums">
                  ₹{overview?.total_approved_expenses.toLocaleString('en-IN') || '0'}
                </p>
              </div>
              <span className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60">
                <Building className="w-4 h-4" />
              </span>
            </div>
            <p className="text-[11px] text-[#6B6459] mt-2.5">
              प्रलंबित: ₹{overview?.total_pending_expenses.toLocaleString('en-IN') || '0'}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.08)] bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
                  {t.net_balance}
                </p>
                <p className="text-2xl font-black text-emerald-800 mt-1 tabular-nums">
                  ₹{overview?.net_balance.toLocaleString('en-IN') || '0'}
                </p>
              </div>
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300/60">
                <IndianRupee className="w-4 h-4" />
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-2.5 font-medium">
              एकूण जमा − मंजूर खर्च
            </p>
          </div>
        </div>

        {/* Payment Mode Split */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)]">
          <h3 className="text-sm font-bold text-[#292118] mb-3">पेमेंट मोडनुसार वर्गीकरण (Collections Breakdown)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#E5E1D8]/80">
              <span className="text-xs font-semibold text-[#6B6459]">रोख वर्गणी (Cash Collection)</span>
              <p className="text-2xl font-black text-[#292118] mt-1 tabular-nums">
                ₹{overview?.total_cash_collected.toLocaleString('en-IN') || '0'}
              </p>
              <p className="text-xs text-[#6B6459] mt-1.5 font-medium">
                खजिनदारांकडे ताळमेळ: <span className="font-bold text-emerald-700">₹{overview?.total_cash_reconciled.toLocaleString('en-IN') || '0'}</span>
              </p>
            </div>

            <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80">
              <span className="text-xs font-semibold text-sky-800">UPI / QR कोड (Digital Collection)</span>
              <p className="text-2xl font-black text-sky-900 mt-1 tabular-nums">
                ₹{overview?.total_upi_collected.toLocaleString('en-IN') || '0'}
              </p>
              <p className="text-xs text-sky-700 mt-1.5 font-medium">थेट मंडळाच्या बँक खात्यात जमा</p>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80">
              <span className="text-xs font-semibold text-amber-800">येणे वर्गणी (Pending Collection)</span>
              <p className="text-2xl font-black text-amber-900 mt-1 tabular-nums">
                ₹{overview?.total_pending_collected?.toLocaleString('en-IN') || '0'}
              </p>
              <p className="text-xs text-amber-700 mt-1.5 font-medium">भविष्यात जमा होणे बाकी वर्गणी</p>
            </div>
          </div>
        </div>

        {/* Volunteer Cash In Hand Table */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)] overflow-hidden">
          <div className="p-4 border-b border-[#E5E1D8]/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#292118]">कार्यकर्त्यांकडील रोख शिल्लक (Live Cash In Hand)</h3>
              <p className="text-xs text-[#6B6459] mt-0.5">ज्या कार्यकर्त्यांनी अजून खजिनदारांकडे रोख रक्कम जमा केलेली नाही</p>
            </div>
            <Link href="/reconciliation">
              <Button variant="primary" size="sm" className="text-xs font-bold rounded-xl cursor-pointer">
                हिशोब घ्या (Reconcile)
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF9F6] text-[#6B6459] font-bold text-[11px] uppercase tracking-wider border-b border-[#E5E1D8]/70">
                <tr>
                  <th className="px-4 py-3">कार्यकर्ता नाव</th>
                  <th className="px-4 py-3 text-right">आजची रोख</th>
                  <th className="px-4 py-3 text-right">आजचे UPI</th>
                  <th className="px-4 py-3 text-right">एकूण पावत्या</th>
                  <th className="px-4 py-3 text-right">शिल्लक रोख (Handover Due)</th>
                  <th className="px-4 py-3 text-center">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]/60">
                {overview?.volunteer_tallies.map((v) => (
                  <tr key={v.volunteer_id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#292118]">{v.volunteer_name}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">₹{v.today_cash_collected.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">₹{v.today_upi_collected.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{v.total_donations_count}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-[#7C2D12]">
                      {v.total_cash_unreconciled > 0 ? (
                        <span className="text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80 font-mono text-xs">
                          ₹{v.total_cash_unreconciled.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 text-xs font-semibold">
                          ₹0 (Clear)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {v.total_cash_unreconciled > 0 ? (
                        <Link href={`/reconciliation?volunteerId=${v.volunteer_id}`}>
                          <button className="px-3 py-1 bg-gradient-to-r from-[#7C2D12] to-[#C2410C] text-white rounded-xl text-xs font-bold hover:from-[#5C220E] hover:to-[#9A3412] transition shadow-2xs cursor-pointer">
                            जमा करा
                          </button>
                        </Link>
                      ) : (
                        <span className="text-[#A8A297] text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
