'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { Card, Button } from '@vargani/ui';
import { apiRequest, downloadFile } from '../../../lib/api-client';
import { getT } from '../../../lib/i18n';
import { TreasurerOverview, Role } from '@vargani/types';
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
      <div className="bg-white border-b border-[#E5E1D8] px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center justify-between overflow-x-auto gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg bg-orange-50 text-[#F97316] font-bold border border-orange-200"
            >
              {t.dashboard}
            </Link>
            <Link
              href="/reconciliation"
              className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC] hover:text-[#292118]"
            >
              {t.reconciliation}
            </Link>
            <Link
              href="/expenses"
              className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC] hover:text-[#292118]"
            >
              {t.expenses}
            </Link>
            <Link
              href="/members"
              className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC] hover:text-[#292118]"
            >
              {t.members}
            </Link>
            {role === Role.ADMIN && (
              <Link
                href="/settings"
                className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC] hover:text-[#292118]"
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
              className="text-xs h-8 gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isExportingDonations ? 'डाउनलोड होत आहे...' : 'वर्गणी CSV'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExpenses}
              disabled={isExportingExpenses}
              className="text-xs h-8 gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-red-600" />
              <span>{isExportingExpenses ? 'डाउनलोड होत आहे...' : 'खर्च CSV'}</span>
            </Button>
            <Link href={`/mandal/${activeMandal?.slug}/transparency`} target="_blank">
              <Button variant="ghost" size="sm" className="text-xs h-8 gap-1">
                <span>पारदर्शकता पोर्टल</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto w-full px-4 pt-6 flex-1 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-[#292118]">
              {activeMandal?.name} - {t.dashboard}
            </h2>
            <p className="text-xs text-[#6B6459] mt-0.5">
              थेट उत्सव जमा, खर्च आणि कार्यकर्त्यांकडील रोख रक्कमेचा हिशोब
            </p>
          </div>

          <Link href="/collect">
            <Button variant="primary" size="md" className="font-bold gap-1.5">
              <span>+ नवीन वर्गणी पावती</span>
            </Button>
          </Link>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="default" padding="md" className="border-t-4 border-t-[#F97316] shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#6B6459] uppercase tracking-wider">
                  {t.total_festival_collection}
                </p>
                <p className="text-2xl font-black text-[#292118] mt-1">
                  ₹{overview?.festival_total_collected.toLocaleString('en-IN') || '0'}
                </p>
              </div>
              <span className="p-2 rounded-xl bg-orange-50 text-[#F97316]">
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-2">
              आज जमा: ₹{overview?.today_total_collected.toLocaleString('en-IN') || '0'}
            </p>
          </Card>

          <Card variant="default" padding="md" className="border-t-4 border-t-amber-500 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#6B6459] uppercase tracking-wider">
                  {t.cash_in_hand}
                </p>
                <p className="text-2xl font-black text-amber-700 mt-1">
                  ₹{overview?.total_cash_in_hand_volunteers.toLocaleString('en-IN') || '0'}
                </p>
              </div>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Wallet className="w-5 h-5" />
              </span>
            </div>
            <Link href="/reconciliation" className="text-[11px] text-amber-800 font-bold hover:underline mt-2 inline-block">
              हिशोब पडताळणी करा (Reconcile) →
            </Link>
          </Card>

          <Card variant="default" padding="md" className="border-t-4 border-t-red-500 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#6B6459] uppercase tracking-wider">
                  {t.approved_expenses}
                </p>
                <p className="text-2xl font-black text-red-700 mt-1">
                  ₹{overview?.total_approved_expenses.toLocaleString('en-IN') || '0'}
                </p>
              </div>
              <span className="p-2 rounded-xl bg-red-50 text-red-600">
                <Building className="w-5 h-5" />
              </span>
            </div>
            <p className="text-[11px] text-[#6B6459] mt-2">
              प्रलंबित मंजुरी: ₹{overview?.total_pending_expenses.toLocaleString('en-IN') || '0'}
            </p>
          </Card>

          <Card variant="default" padding="md" className="border-t-4 border-t-emerald-600 shadow-sm bg-gradient-to-br from-white to-emerald-50/40">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
                  {t.net_balance}
                </p>
                <p className="text-2xl font-black text-emerald-800 mt-1">
                  ₹{overview?.net_balance.toLocaleString('en-IN') || '0'}
                </p>
              </div>
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <IndianRupee className="w-5 h-5" />
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-2 font-medium">
              एकूण जमा − मंजूर खर्च
            </p>
          </Card>
        </div>

        {/* Payment Mode Split */}
        <Card variant="default" padding="md" className="shadow-sm">
          <h3 className="text-sm font-bold text-[#292118] mb-3">पेमेंट मोडनुसार वर्गीकरण (Collections Breakdown)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#F3F1EC] rounded-2xl border border-[#E5E1D8]">
              <span className="text-xs font-semibold text-[#6B6459]">रोख वर्गणी (Cash Collection)</span>
              <p className="text-2xl font-bold text-[#292118] mt-1">
                ₹{overview?.total_cash_collected.toLocaleString('en-IN') || '0'}
              </p>
              <p className="text-xs text-[#6B6459] mt-1.5 font-medium">
                खजिनदारांकडे ताळमेळ झालेली जमा: <span className="font-bold text-emerald-700">₹{overview?.total_cash_reconciled.toLocaleString('en-IN') || '0'}</span>
              </p>
            </div>

            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200">
              <span className="text-xs font-semibold text-blue-800">UPI / QR कोड (Digital Collection)</span>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                ₹{overview?.total_upi_collected.toLocaleString('en-IN') || '0'}
              </p>
              <p className="text-xs text-blue-700 mt-1.5 font-medium">थेट मंडळाच्या बँक खात्यात जमा</p>
            </div>
          </div>
        </Card>

        {/* Volunteer Cash In Hand Table */}
        <Card variant="default" padding="none" className="shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E5E1D8] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#292118]">कार्यकर्त्यांकडील रोख शिल्लक (Live Cash In Hand)</h3>
              <p className="text-xs text-[#6B6459] mt-0.5">ज्या कार्यकर्त्यांनी अजून खजिनदारांकडे रोख रक्कम जमा केलेली नाही</p>
            </div>
            <Link href="/reconciliation">
              <Button variant="primary" size="sm" className="text-xs font-bold">
                हिशोब घ्या (Reconcile)
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F3F1EC] text-[#6B6459] font-bold text-xs uppercase border-b border-[#E5E1D8]">
                <tr>
                  <th className="px-4 py-3">कार्यकर्ता नाव</th>
                  <th className="px-4 py-3 text-right">आजची रोख</th>
                  <th className="px-4 py-3 text-right">आजचे UPI</th>
                  <th className="px-4 py-3 text-right">एकूण पावत्या</th>
                  <th className="px-4 py-3 text-right">शिल्लक रोख (Handover Due)</th>
                  <th className="px-4 py-3 text-center">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {overview?.volunteer_tallies.map((v) => (
                  <tr key={v.volunteer_id} className="hover:bg-orange-50/30 transition">
                    <td className="px-4 py-3 font-semibold text-[#292118]">{v.volunteer_name}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{v.today_cash_collected.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{v.today_upi_collected.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-medium">{v.total_donations_count}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-[#7C2D12]">
                      {v.total_cash_unreconciled > 0 ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ₹{v.total_cash_unreconciled.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">₹0 (Clear)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {v.total_cash_unreconciled > 0 ? (
                        <Link href={`/reconciliation?volunteerId=${v.volunteer_id}`}>
                          <button className="px-2.5 py-1 bg-[#F97316] text-white rounded-lg text-xs font-bold hover:bg-[#C2410C] transition">
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
        </Card>
      </main>
    </div>
  );
}
