'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { ReceiptModal } from '../../../components/ReceiptModal';
import { Card, Button, Input, StatusBadge } from '@vargani/ui';
import { apiRequest, downloadFile } from '../../../lib/api-client';
import { getT } from '../../../lib/i18n';
import { TreasurerOverview, Role, Language, PaymentMode } from '@vargani/types';
import Link from 'next/link';
import {
  IndianRupee,
  Wallet,
  TrendingUp,
  Building,
  ArrowUpRight,
  FileSpreadsheet,
  Clock,
  PlusCircle,
  Calendar,
  Receipt,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Eye,
  FileText,
  User,
  ShieldCheck,
  Search,
  Download,
  ExternalLink,
} from 'lucide-react';

export default function UnifiedDashboardPage() {
  const { user, activeMandal, role, language, token } = useAuth();
  const t = getT(language);

  const [overview, setOverview] = useState<TreasurerOverview | null>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Volunteer tabs
  const [volunteerTab, setVolunteerTab] = useState<'overview' | 'donations' | 'expenses' | 'reports'>('overview');
  const [donationSearch, setDonationSearch] = useState('');
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Exports
  const [isExportingDonations, setIsExportingDonations] = useState(false);
  const [isExportingExpenses, setIsExportingExpenses] = useState(false);

  const fetchDashboardData = () => {
    if (activeMandal && token) {
      const calls: Promise<any>[] = [
        apiRequest<TreasurerOverview>('/reconciliation/overview'),
      ];

      if (role === Role.VOLUNTEER) {
        calls.push(apiRequest<any[]>('/donations?limit=100'));
        calls.push(apiRequest<any[]>('/expenses'));
      }

      Promise.all(calls)
        .then(([overviewData, donationsData, expensesData]) => {
          setOverview(overviewData);
          if (donationsData) setDonations(donationsData);
          if (expensesData) setExpenses(expensesData);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeMandal, token, role]);

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

  const openReceipt = (d: any) => {
    setSelectedDonation({
      receiptNumber: d.receipt_number || d.receiptNumber,
      donorName: d.donor_name || d.donorName,
      donorPhone: d.donor_phone || d.donorPhone,
      amount: parseFloat(d.amount),
      paymentMode: d.payment_mode || d.paymentMode,
      flatWing: d.flat_wing || d.flatWing,
      date: d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      volunteerName: d.volunteer_name || d.volunteerName || 'खजिनदार',
      language: language,
    });
    setIsReceiptModalOpen(true);
  };

  const filteredDonations = donations.filter((d) => {
    if (!donationSearch.trim()) return true;
    const term = donationSearch.toLowerCase();
    return (
      d.donor_name?.toLowerCase().includes(term) ||
      d.receipt_number?.toString().includes(term) ||
      d.donor_phone?.includes(term)
    );
  });

  const totalExpensesApproved = expenses
    .filter((e) => e.status === 'APPROVED')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // =========================================================================
  // VOLUNTEER VIEW
  // =========================================================================
  if (role === Role.VOLUNTEER) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6] pb-16">
        <Header />
        <OfflineBanner />

        {/* Volunteer Sub-Nav */}
        <div className="bg-white/90 backdrop-blur-md border-b border-[#E5E1D8]/80 px-4 py-2 sticky top-[53px] z-20 shadow-2xs">
          <div className="max-w-5xl mx-auto flex items-center justify-between overflow-x-auto gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setVolunteerTab('overview')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  volunteerTab === 'overview'
                    ? 'bg-[#7C2D12] text-white shadow-2xs'
                    : 'text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118]'
                }`}
              >
                डॅशबोर्ड
              </button>
              <button
                onClick={() => setVolunteerTab('donations')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  volunteerTab === 'donations'
                    ? 'bg-[#7C2D12] text-white shadow-2xs'
                    : 'text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118]'
                }`}
              >
                जमा पावत्या (Donations)
              </button>
              <button
                onClick={() => setVolunteerTab('expenses')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  volunteerTab === 'expenses'
                    ? 'bg-[#7C2D12] text-white shadow-2xs'
                    : 'text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118]'
                }`}
              >
                खर्च (Expenses)
              </button>
              <button
                onClick={() => setVolunteerTab('reports')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  volunteerTab === 'reports'
                    ? 'bg-[#7C2D12] text-white shadow-2xs'
                    : 'text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118]'
                }`}
              >
                अहवाल व पारदर्शकता
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-5xl mx-auto w-full px-4 pt-6 flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#292118]">
                  {activeMandal?.name || 'मंडळ'}
                </h2>
                <span className="text-[10px] font-bold text-[#C2410C] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/70">
                  कार्यकर्ता डॅशबोर्ड (Volunteer)
                </span>
              </div>
              <p className="text-xs text-[#6B6459] mt-0.5">
                खजिनदारांनी जमा केलेली वर्गणी, मंडळाचा जमा-खर्च आणि वार्षिक अहवाल.
              </p>
            </div>

            <Link href={`/mandal/${activeMandal?.slug}/transparency`} target="_blank">
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 rounded-xl cursor-pointer">
                <span>पारदर्शकता पोर्टल</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#C2410C]" />
              </Button>
            </Link>
          </div>

          {/* Volunteer 3 Primary Metrics: Total Collection, Total Pending, Net Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-[#6B6459] uppercase tracking-wider">
                    एकूण जमा (Total Collection)
                  </p>
                  <p className="text-2xl font-black text-[#7C2D12] mt-1 tabular-nums">
                    ₹{(overview?.festival_total_collected || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="p-2 rounded-xl bg-orange-50 text-[#C2410C] border border-orange-200/60">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <p className="text-[11px] text-[#6B6459] mt-2 font-medium">
                खजिनदारांनी नोंदवलेली एकूण वर्गणी
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)]">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-[#6B6459] uppercase tracking-wider">
                    एकूण प्रलंबित (Total Pending)
                  </p>
                  <p className="text-2xl font-black text-amber-700 mt-1 tabular-nums">
                    ₹{(overview?.total_pending_collected || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <p className="text-[11px] text-amber-700 mt-2 font-medium">
                येणे बाकी देणगीदारांची वर्गणी
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.08)] bg-gradient-to-br from-white to-emerald-50/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
                    शिल्लक निधी (Net Balance)
                  </p>
                  <p className="text-2xl font-black text-emerald-800 mt-1 tabular-nums">
                    ₹{(overview?.net_balance || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300/60">
                  <IndianRupee className="w-4 h-4" />
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-2 font-medium">
                एकूण जमा − मंजूर खर्च
              </p>
            </div>
          </div>

          {/* Volunteer Tab: Overview */}
          {volunteerTab === 'overview' && (
            <div className="space-y-6">
              {/* Payment Mode Breakdown */}
              <div className="bg-white rounded-2xl p-5 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)]">
                <h3 className="text-sm font-bold text-[#292118] mb-3">पेमेंट पद्धतीनुसार वर्गीकरण</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#E5E1D8]/80">
                    <span className="text-xs font-semibold text-[#6B6459]">रोख वर्गणी (Cash)</span>
                    <p className="text-xl font-black text-[#292118] mt-1 tabular-nums">
                      ₹{(overview?.total_cash_collected || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-200/80">
                    <span className="text-xs font-semibold text-sky-800">UPI वर्गणी (Online)</span>
                    <p className="text-xl font-black text-sky-900 mt-1 tabular-nums">
                      ₹{(overview?.total_upi_collected || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
                    <span className="text-xs font-semibold text-amber-800">येणे वर्गणी (Pending)</span>
                    <p className="text-xl font-black text-amber-900 mt-1 tabular-nums">
                      ₹{(overview?.total_pending_collected || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Donations Table */}
              <div className="bg-white rounded-2xl border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)] overflow-hidden">
                <div className="p-4 border-b border-[#E5E1D8]/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#7C2D12]" />
                    <h3 className="text-sm font-extrabold text-[#292118]">खजिनदारांनी जमा केलेल्या ताज्या पावत्या</h3>
                  </div>
                  <button
                    onClick={() => setVolunteerTab('donations')}
                    className="text-xs text-[#C2410C] font-bold hover:underline cursor-pointer"
                  >
                    सर्व पावत्या पहा →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#FAF9F6] text-[#6B6459] font-bold text-[11px] uppercase tracking-wider border-b border-[#E5E1D8]/70">
                      <tr>
                        <th className="px-4 py-2.5">पावती क्र.</th>
                        <th className="px-4 py-2.5">देणगीदार</th>
                        <th className="px-4 py-2.5">मोड</th>
                        <th className="px-4 py-2.5 text-right">रक्कम</th>
                        <th className="px-4 py-2.5 text-center">पावती</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E1D8]/60">
                      {donations.slice(0, 5).map((d) => (
                        <tr key={d.id} className="hover:bg-orange-50/20 transition-colors">
                          <td className="px-4 py-2.5 font-mono font-bold text-[#7C2D12]">#{d.receipt_number}</td>
                          <td className="px-4 py-2.5 font-semibold text-[#292118]">{d.donor_name}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                d.payment_mode === 'CASH'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : d.payment_mode === 'UPI'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {d.payment_mode}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-black text-[#292118] tabular-nums">
                            ₹{parseFloat(d.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              onClick={() => openReceipt(d)}
                              className="p-1 rounded-lg text-[#C2410C] hover:bg-orange-50 transition cursor-pointer"
                              title="पावती पहा"
                            >
                              <Eye className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Volunteer Tab: All Donations (Display all donations collected by Treasurer) */}
          {volunteerTab === 'donations' && (
            <div className="bg-white rounded-2xl border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)] overflow-hidden">
              <div className="p-4 border-b border-[#E5E1D8]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-[#292118]">खजिनदारांनी जमा केलेल्या सर्व पावत्या</h3>
                  <p className="text-xs text-[#6B6459] mt-0.5">मंडळातील खजिनदारांनी नोंदवलेल्या सर्व देणग्यांची यादी</p>
                </div>

                <div className="w-full sm:w-64">
                  <Input
                    placeholder="नाव किंवा पावती क्र. शोधा..."
                    value={donationSearch}
                    onChange={(e) => setDonationSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#FAF9F6] text-[#6B6459] font-bold text-[11px] uppercase tracking-wider border-b border-[#E5E1D8]/70">
                    <tr>
                      <th className="px-4 py-3">पावती क्र.</th>
                      <th className="px-4 py-3">देणगीदार</th>
                      <th className="px-4 py-3">पेमेंट मोड</th>
                      <th className="px-4 py-3 text-right">रक्कम (₹)</th>
                      <th className="px-4 py-3">तारीख</th>
                      <th className="px-4 py-3 text-center">पावती</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8]/60">
                    {filteredDonations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[#A8A297]">
                          कोणतीही पावती आढळली नाही.
                        </td>
                      </tr>
                    ) : (
                      filteredDonations.map((d) => (
                        <tr key={d.id} className="hover:bg-orange-50/20 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-[#7C2D12]">#{d.receipt_number}</td>
                          <td className="px-4 py-3 font-semibold text-[#292118]">
                            {d.donor_name}
                            {d.flat_wing && <span className="text-xs text-[#A8A297] ml-1 font-normal">({d.flat_wing})</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                d.payment_mode === 'CASH'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : d.payment_mode === 'UPI'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {d.payment_mode}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-black text-[#292118] tabular-nums">
                            ₹{parseFloat(d.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#6B6459]">
                            {new Date(d.created_at).toLocaleDateString('mr-IN')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => openReceipt(d)}
                              className="p-1.5 rounded-lg text-[#C2410C] hover:bg-orange-50 transition cursor-pointer"
                              title="पावती पहा"
                            >
                              <Eye className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Volunteer Tab: Expenses (Display all expenses recorded by Treasurer and Admin) */}
          {volunteerTab === 'expenses' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)]">
                  <span className="text-xs font-semibold text-[#6B6459] uppercase">एकूण मंजूर खर्च</span>
                  <p className="text-2xl font-black text-rose-700 mt-1 tabular-nums">
                    ₹{totalExpensesApproved.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-[#6B6459] mt-1">खजिनदार व व्यवस्थापकांनी नोंदवलेला खर्च</p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)]">
                  <span className="text-xs font-semibold text-[#6B6459] uppercase">एकूण खर्च नोंदी</span>
                  <p className="text-2xl font-black text-[#292118] mt-1 tabular-nums">
                    {expenses.length} नोंदी
                  </p>
                  <p className="text-[11px] text-[#6B6459] mt-1">पारदर्शकतेसाठी सर्व नोंदी उपलब्ध</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)] overflow-hidden">
                <div className="p-4 border-b border-[#E5E1D8]/70">
                  <h3 className="text-sm font-extrabold text-[#292118]">उत्सव खर्च नोंदी (Expenses Ledger)</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#FAF9F6] text-[#6B6459] font-bold text-[11px] uppercase tracking-wider border-b border-[#E5E1D8]/70">
                      <tr>
                        <th className="px-4 py-3">वर्गवारी</th>
                        <th className="px-4 py-3">तपशील</th>
                        <th className="px-4 py-3">मोड</th>
                        <th className="px-4 py-3 text-right">रक्कम (₹)</th>
                        <th className="px-4 py-3">नोंदवणारा</th>
                        <th className="px-4 py-3 text-center">स्थिती</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E1D8]/60">
                      {expenses.map((e) => (
                        <tr key={e.id} className="hover:bg-orange-50/20 transition-colors">
                          <td className="px-4 py-3 font-semibold text-[#292118]">
                            <span className="bg-[#F3F1EC] px-2 py-0.5 rounded text-xs font-bold text-[#7C2D12]">
                              {e.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#292118]">{e.description}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                e.payment_mode === PaymentMode.UPI
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {e.payment_mode || 'CASH'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-black text-[#7C2D12] tabular-nums">
                            ₹{parseFloat(e.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#6B6459]">{e.logged_by_name}</td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge
                              status={e.status === 'APPROVED' ? 'success' : e.status === 'REJECTED' ? 'error' : 'warning'}
                              label={e.status}
                              size="sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Volunteer Tab: Annual Report & Public Transparency */}
          {volunteerTab === 'reports' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-orange-50 text-[#C2410C]">
                    <FileText className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#292118]">
                      {activeMandal?.ahwal_title || 'वार्षिक अहवाल (Annual Report)'}
                    </h3>
                    <p className="text-xs text-[#6B6459]">मंडळाचा अधिकृत वार्षिक जमा-खर्च अहवाल</p>
                  </div>
                </div>

                {activeMandal?.ahwal_url ? (
                  <div className="pt-2">
                    <a
                      href={activeMandal.ahwal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7C2D12] text-white rounded-xl text-xs font-bold hover:bg-[#5C220E] transition shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>वार्षिक अहवाल डाउनलोड करा</span>
                    </a>
                  </div>
                ) : (
                  <div className="p-4 bg-[#FAF9F6] rounded-xl text-xs text-[#6B6459] border border-[#E5E1D8]">
                    मंडळाने अद्याप वार्षिक अहवाल फाईल अपलोड केलेली नाही.
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#292118]">सार्वजनिक पारदर्शकता पोर्टल</h3>
                    <p className="text-xs text-[#6B6459]">नागरिकांसाठी थेट जमा-खर्च पडताळणी पोर्टल</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/mandal/${activeMandal?.slug}/transparency`}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition shadow-xs"
                  >
                    <span>पारदर्शकता पोर्टल उघडा</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Receipt Modal */}
        {selectedDonation && (
          <ReceiptModal
            isOpen={isReceiptModalOpen}
            onClose={() => setIsReceiptModalOpen(false)}
            donation={selectedDonation}
            mandal={activeMandal}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // ADMIN & TREASURER DASHBOARD VIEW
  // =========================================================================
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
                {role === Role.ADMIN ? 'व्यवस्थापक (Admin) डॅशबोर्ड' : 'खजिनदार (Treasurer) डॅशबोर्ड'}
              </span>
            </div>
            <p className="text-xs text-[#6B6459] mt-0.5">
              {language === Language.ENGLISH
                ? 'Live festival collections, approved expenses, and cash reconciliation.'
                : 'थेट उत्सव जमा, खर्च आणि कार्यकर्त्यांकडील रोख रक्कमेचा हिशोब'}
            </p>
          </div>

          {/* Donation Receipt Access: ONLY Treasurer can create receipts */}
          {role === Role.TREASURER && (
            <Link href="/collect">
              <Button variant="primary" size="md" className="font-bold gap-1.5 rounded-xl shadow-xs cursor-pointer">
                <PlusCircle className="w-4 h-4" />
                <span>{t.new_receipt}</span>
              </Button>
            </Link>
          )}
        </div>

        {/* 1. TODAY'S COLLECTION (आजची जमा) */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-50 text-[#C2410C]">
                <Calendar className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-[#292118]">
                आजची जमा (Today’s Collection)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Live Today
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-gradient-to-br from-orange-50/50 to-white rounded-xl border border-orange-200/60">
              <p className="text-xs font-semibold text-[#7C2D12]">आजची एकूण वर्गणी</p>
              <p className="text-xl font-black text-[#7C2D12] mt-1 tabular-nums">
                ₹{(overview?.today_total_collected || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-[#A8A297] mt-0.5 font-medium">आज जमा झालेली रक्कम</p>
            </div>

            <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#E5E1D8]/80">
              <p className="text-xs font-semibold text-[#6B6459]">आजची रोख (Cash)</p>
              <p className="text-xl font-black text-[#292118] mt-1 tabular-nums">
                ₹{(overview?.today_cash_collected || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-[#A8A297] mt-0.5 font-medium">आज रोख जमा</p>
            </div>

            <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-200/70">
              <p className="text-xs font-semibold text-sky-800">आजचे UPI (Online)</p>
              <p className="text-xl font-black text-sky-900 mt-1 tabular-nums">
                ₹{(overview?.today_upi_collected || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-sky-700 mt-0.5 font-medium">थेट बँक खात्यात</p>
            </div>

            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/70">
              <p className="text-xs font-semibold text-amber-800">आजचे येणे (Pending)</p>
              <p className="text-xl font-black text-amber-900 mt-1 tabular-nums">
                ₹{(overview?.today_pending_collected || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-amber-700 mt-0.5 font-medium">भविष्यात येणे बाकी</p>
            </div>
          </div>
        </div>

        {/* 2. OVERALL FESTIVAL COLLECTION (उत्सव एकूण जमा-खर्च) */}
        <div>
          <h3 className="text-sm font-bold text-[#292118] mb-3 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-50 text-[#C2410C]">
              <TrendingUp className="w-4 h-4" />
            </span>
            उत्सव एकूण जमा-खर्च (Overall Festival Collection)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Festival Collection */}
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
              <p className="text-[11px] text-[#6B6459] mt-2.5">
                एकूण नोंदवलेली उत्सव वर्गणी
              </p>
            </div>

            {/* Cash in Hand */}
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

            {/* Approved Expenses */}
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
                प्रलंबित खर्च: ₹{overview?.total_pending_expenses.toLocaleString('en-IN') || '0'}
              </p>
            </div>

            {/* Net Balance */}
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

          {/* Mode Breakdown Sub-row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div className="p-3.5 bg-white rounded-xl border border-[#E5E1D8]/80">
              <span className="text-xs font-semibold text-[#6B6459]">एकूण रोख (Total Cash)</span>
              <p className="text-lg font-black text-[#292118] mt-0.5 tabular-nums">
                ₹{overview?.total_cash_collected.toLocaleString('en-IN') || '0'}
              </p>
              <p className="text-[11px] text-[#6B6459] mt-1 font-medium">
                खजिनदारांकडे ताळमेळ: <span className="font-bold text-emerald-700">₹{overview?.total_cash_reconciled.toLocaleString('en-IN') || '0'}</span>
              </p>
            </div>

            <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-200/80">
              <span className="text-xs font-semibold text-sky-800">एकूण UPI (Total UPI)</span>
              <p className="text-lg font-black text-sky-900 mt-0.5 tabular-nums">
                ₹{overview?.total_upi_collected.toLocaleString('en-IN') || '0'}
              </p>
              <p className="text-[11px] text-sky-700 mt-1 font-medium">थेट मंडळाच्या बँक खात्यात जमा</p>
            </div>

            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
              <span className="text-xs font-semibold text-amber-800">एकूण येणे बाकी (Total Pending)</span>
              <p className="text-lg font-black text-amber-900 mt-0.5 tabular-nums">
                ₹{overview?.total_pending_collected?.toLocaleString('en-IN') || '0'}
              </p>
              <p className="text-[11px] text-amber-700 mt-1 font-medium">भविष्यात जमा होणे बाकी वर्गणी</p>
            </div>
          </div>
        </div>

        {/* 3. RECENT DONATIONS (नुकत्याच जमा झालेल्या पावत्या) */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)] overflow-hidden">
          <div className="p-4 border-b border-[#E5E1D8]/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Receipt className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#292118]">
                  नुकत्याच जमा झालेल्या पावत्या (Recent Donations)
                </h3>
                <p className="text-xs text-[#6B6459] mt-0.5">नुकतीच नोंदवलेली देणगी व पावत्या</p>
              </div>
            </div>

            <Link href="/donations">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold gap-1.5 rounded-xl cursor-pointer hover:bg-orange-50 hover:text-[#7C2D12] transition shadow-2xs"
              >
                <span>अधिक पहा (View More)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            {overview?.recent_donations && overview.recent_donations.length > 0 ? (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#FAF9F6] text-[#6B6459] font-bold text-[11px] uppercase tracking-wider border-b border-[#E5E1D8]/70">
                  <tr>
                    <th className="px-4 py-2.5">पावती क्र.</th>
                    <th className="px-4 py-2.5">देणगीदार</th>
                    <th className="px-4 py-2.5">पेमेंट मोड</th>
                    <th className="px-4 py-2.5 text-right">रक्कम</th>
                    <th className="px-4 py-2.5">कार्यकर्ता</th>
                    <th className="px-4 py-2.5">वेळ</th>
                    <th className="px-4 py-2.5 text-center">कृती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]/60">
                  {overview.recent_donations.map((d: any) => (
                    <tr key={d.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-bold text-[#7C2D12]">#{d.receipt_number}</td>
                      <td className="px-4 py-2.5 font-semibold text-[#292118]">
                        {d.donor_name}
                        {d.flat_wing && <span className="text-xs text-[#A8A297] ml-1.5 font-normal">({d.flat_wing})</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            d.payment_mode === 'CASH'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : d.payment_mode === 'UPI'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {d.payment_mode}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-[#292118] tabular-nums">
                        ₹{parseFloat(d.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#6B6459] font-medium">{d.volunteer_name || '—'}</td>
                      <td className="px-4 py-2.5 text-[11px] text-[#A8A297] whitespace-nowrap">
                        {new Date(d.created_at).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => openReceipt(d)}
                          className="p-1.5 rounded-lg text-[#C2410C] hover:bg-orange-50 transition cursor-pointer"
                          title="पावती पहा"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-[#6B6459] text-xs">
                अजून कोणत्याही पावत्या नोंदवलेल्या नाहीत.
              </div>
            )}
          </div>
        </div>

        {/* 4. LIVE CASH IN HAND (कार्यकर्त्यांकडील रोख शिल्लक) */}
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

      {/* Receipt Modal for Admin & Treasurer */}
      {selectedDonation && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          donation={selectedDonation}
          mandal={activeMandal}
        />
      )}
    </div>
  );
}
