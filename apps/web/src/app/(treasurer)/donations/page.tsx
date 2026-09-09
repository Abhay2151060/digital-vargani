'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { ReceiptModal } from '../../../components/ReceiptModal';
import { CollectPendingModal } from '../../../components/CollectPendingModal';
import { Card, Button } from '@vargani/ui';
import { apiRequest, downloadFile } from '../../../lib/api-client';
import { getT } from '../../../lib/i18n';
import { Role, Language } from '@vargani/types';
import Link from 'next/link';
import {
  Receipt,
  ArrowLeft,
  Search,
  Download,
  Eye,
  Wallet,
  IndianRupee,
  FileSpreadsheet,
  Calendar,
  User,
  Phone,
  Filter,
} from 'lucide-react';

export default function AllDonationsPage() {
  const { user, activeMandal, role, language, token, isLoading: authLoading } = useAuth();
  const t = getT(language);
  const router = useRouter();

  const [donations, setDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'CASH' | 'UPI' | 'PARTIAL' | 'PENDING'>('ALL');

  // Receipt Modal
  const [selectedDonation, setSelectedDonation] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Collect Pending Modal
  const [collectingDonation, setCollectingDonation] = useState<any | null>(null);

  // Strict Access Control: Admin and Treasurer only
  useEffect(() => {
    if (!authLoading && role && role === Role.VOLUNTEER) {
      router.replace('/dashboard');
    }
  }, [role, authLoading, router]);

  const fetchDonations = () => {
    if (activeMandal && token) {
      setIsLoading(true);
      apiRequest<any[]>('/donations?limit=1000')
        .then((data) => setDonations(data || []))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [activeMandal, token]);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await downloadFile('/reports/donations/csv', `all-donations-${Date.now()}.csv`, token);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'CSV Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const openReceipt = (d: any) => {
    const tot = parseFloat(d.amount);
    const paid = d.total_paid != null ? parseFloat(d.total_paid) : (d.payment_mode !== 'PENDING' ? tot : 0);
    const rem = d.remaining_amount != null ? parseFloat(d.remaining_amount) : (d.payment_mode === 'PENDING' ? tot : 0);
    const status = d.payment_status || (rem <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING');

    setSelectedDonation({
      receiptNumber: d.receipt_number || d.receiptNumber,
      donorName: d.donor_name || d.donorName,
      donorPhone: d.donor_phone || d.donorPhone,
      amount: tot,
      totalPaid: paid,
      remainingAmount: rem,
      paymentStatus: status,
      payments: d.payments || [],
      paymentMode: d.payment_mode || d.paymentMode,
      flatWing: d.flat_wing || d.flatWing,
      date: d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      volunteerName: d.volunteer_name || d.volunteerName || 'खजिनदार',
      language: language,
    });
    setIsReceiptModalOpen(true);
  };

  if (role === Role.VOLUNTEER) {
    return null;
  }

  // Aggregate Metrics
  const nonVoided = donations.filter((d) => !d.is_voided);
  const pendingDonations = nonVoided.filter(
    (d) => d.payment_status === 'PENDING' || (!d.payment_status && d.payment_mode === 'PENDING')
  );
  const partialDonations = nonVoided.filter((d) => d.payment_status === 'PARTIAL');
  const cashDonations = nonVoided.filter(
    (d) => d.payment_mode === 'CASH' && d.payment_status !== 'PENDING'
  );
  const upiDonations = nonVoided.filter(
    (d) => d.payment_mode === 'UPI' && d.payment_status !== 'PENDING'
  );

  const totalCash = nonVoided.reduce((sum, d) => {
    if (d.payment_mode === 'CASH') {
      return sum + (d.total_paid != null ? parseFloat(d.total_paid) : parseFloat(d.amount || 0));
    }
    return sum;
  }, 0);

  const totalUpi = nonVoided.reduce((sum, d) => {
    if (d.payment_mode === 'UPI') {
      return sum + (d.total_paid != null ? parseFloat(d.total_paid) : parseFloat(d.amount || 0));
    }
    return sum;
  }, 0);

  const totalPending = nonVoided.reduce((sum, d) => {
    const rem = d.remaining_amount != null ? parseFloat(d.remaining_amount) : (d.payment_mode === 'PENDING' ? parseFloat(d.amount || 0) : 0);
    return sum + rem;
  }, 0);

  const totalAmount = totalCash + totalUpi;
  const collectedDonationsCount = cashDonations.length + upiDonations.length;

  // Filtered List
  const filteredDonations = donations.filter((d) => {
    if (filterMode === 'CASH' && d.payment_mode !== 'CASH') return false;
    if (filterMode === 'UPI' && d.payment_mode !== 'UPI') return false;
    if (filterMode === 'PENDING') {
      const isPend = d.payment_status === 'PENDING' || (!d.payment_status && d.payment_mode === 'PENDING');
      if (!isPend) return false;
    }
    if (filterMode === 'PARTIAL') {
      if (d.payment_status !== 'PARTIAL') return false;
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (d.donor_name && d.donor_name.toLowerCase().includes(term)) ||
      (d.receipt_number && d.receipt_number.toLowerCase().includes(term)) ||
      (d.donor_phone && d.donor_phone.toLowerCase().includes(term)) ||
      (d.flat_wing && d.flat_wing.toLowerCase().includes(term)) ||
      (d.volunteer_name && d.volunteer_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] pb-24">
      <Header />
      <OfflineBanner />

      {/* Sub-navigation bar */}
      <div className="bg-white border-b border-[#E5E1D8] px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[#7C2D12] bg-orange-50 font-bold border border-orange-200/60 hover:bg-orange-100/60 transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.dashboard}</span>
            </Link>
            <Link href="/reconciliation" className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#F3F1EC] transition shrink-0">
              {t.reconciliation}
            </Link>
            <Link href="/expenses" className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#F3F1EC] transition shrink-0">
              {t.expenses}
            </Link>
            <Link href="/reports" className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#F3F1EC] transition shrink-0">
              {t.reports}
            </Link>
            {role === Role.ADMIN && (
              <Link href="/settings" className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#F3F1EC] transition shrink-0">
                {t.settings}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="text-xs font-bold gap-1.5 rounded-xl cursor-pointer hover:bg-emerald-50 hover:text-emerald-800 transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto w-full px-4 pt-6 flex-1 space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <Receipt className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-[#292118]">
                  {t.all_collected_donations}
                </h2>
                <p className="text-xs text-[#6B6459] mt-0.5">
                  {t.all_collected_donations_sub}
                </p>
              </div>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
            {t.total_receipts_recorded}: {donations.length}
          </span>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)]">
            <span className="text-xs font-semibold text-[#6B6459]">{t.total_collection}</span>
            <p className="text-xl font-black text-[#292118] mt-1 tabular-nums">
              ₹{totalAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-[#A8A297] mt-0.5">{collectedDonationsCount} {t.from_collected_receipts}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)]">
            <span className="text-xs font-semibold text-emerald-800">{t.cash_donations}</span>
            <p className="text-xl font-black text-emerald-700 mt-1 tabular-nums">
              ₹{totalCash.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-[#A8A297] mt-0.5">{cashDonations.length} {t.cash_receipts_unit}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)]">
            <span className="text-xs font-semibold text-sky-800">{t.upi_donations}</span>
            <p className="text-xl font-black text-sky-700 mt-1 tabular-nums">
              ₹{totalUpi.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-[#A8A297] mt-0.5">{upiDonations.length} {t.upi_receipts_unit}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)]">
            <span className="text-xs font-semibold text-amber-800">{t.pending_collection}</span>
            <p className="text-xl font-black text-amber-700 mt-1 tabular-nums">
              ₹{totalPending.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-[#A8A297] mt-0.5">{pendingDonations.length} {t.pending_records_unit}</p>
          </div>
        </div>

        {/* Search, Filter Tabs & Donations Table Card */}
        <div className="bg-white rounded-2xl border border-[#E5E1D8]/80 shadow-[0_4px_16px_-4px_rgba(41,33,24,0.04)] overflow-hidden">
          {/* Search & Filter bar */}
          <div className="p-4 border-b border-[#E5E1D8]/70 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#A8A297] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.search_donations_placeholder}
                className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl text-xs sm:text-sm text-[#292118] placeholder:text-[#A8A297] focus:outline-none focus:border-[#F97316] transition"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold shrink-0">
              {[
                { key: 'ALL', label: t.all, count: donations.length },
                { key: 'CASH', label: t.cash, count: cashDonations.length },
                { key: 'UPI', label: t.upi, count: upiDonations.length },
                { key: 'PARTIAL', label: language === Language.ENGLISH ? 'Partial' : 'अंशतः जमा', count: partialDonations.length },
                { key: 'PENDING', label: t.pending, count: pendingDonations.length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterMode(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    filterMode === tab.key
                      ? 'bg-[#7C2D12] text-white shadow-2xs'
                      : 'bg-[#FAF9F6] text-[#6B6459] border border-[#E5E1D8] hover:bg-[#F3F1EC]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      filterMode === tab.key ? 'bg-white/20 text-white' : 'bg-stone-200/70 text-[#6B6459]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center text-[#6B6459] text-sm">
                {t.loading_donations}
              </div>
            ) : filteredDonations.length > 0 ? (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#FAF9F6] text-[#6B6459] font-bold text-[11px] uppercase tracking-wider border-b border-[#E5E1D8]/70">
                  <tr>
                    <th className="px-4 py-3">{t.receipt_no}</th>
                    <th className="px-4 py-3">{t.donor}</th>
                    <th className="px-4 py-3">{t.payment_mode}</th>
                    <th className="px-4 py-3 text-right">{t.amount}</th>
                    <th className="px-4 py-3">{t.recorded_by}</th>
                    <th className="px-4 py-3">{t.date_and_time}</th>
                    <th className="px-4 py-3 text-center">{t.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]/60">
                  {filteredDonations.map((d: any) => (
                    <tr key={d.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#7C2D12]">
                        #{d.receipt_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#292118]">{d.donor_name}</div>
                        <div className="text-[11px] text-[#A8A297] flex items-center gap-2 mt-0.5">
                          {d.flat_wing && <span>{t.flat_wing_short}: {d.flat_wing}</span>}
                          {d.donor_phone && <span>{t.phone_short}: {d.donor_phone}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {d.payment_status === 'PARTIAL' ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                            {language === Language.ENGLISH ? 'Partial' : 'अंशतः जमा'}
                          </span>
                        ) : d.payment_status === 'PENDING' || d.payment_mode === 'PENDING' ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                            {t.pending}
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              d.payment_mode === 'CASH'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}
                          >
                            {d.payment_mode === 'CASH' ? t.cash : t.upi}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-black text-[#292118] tabular-nums text-sm">
                          ₹{parseFloat(d.amount).toLocaleString('en-IN')}
                        </div>
                        {d.payment_status === 'PARTIAL' && (
                          <div className="text-[10px] text-[#6B6459] tabular-nums mt-0.5">
                            <span className="text-emerald-700 font-semibold">
                              {language === Language.ENGLISH ? 'Paid' : 'जमा'}: ₹{parseFloat(d.total_paid || 0).toLocaleString('en-IN')}
                            </span>
                            {' • '}
                            <span className="text-amber-700 font-semibold">
                              {language === Language.ENGLISH ? 'Rem' : 'बाकी'}: ₹{parseFloat(d.remaining_amount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        {(d.payment_status === 'PENDING' || (d.payment_mode === 'PENDING' && !d.payment_status)) && (
                          <div className="text-[10px] text-amber-700 font-semibold tabular-nums mt-0.5">
                            {language === Language.ENGLISH ? 'Remaining' : 'शिल्लक'}: ₹{parseFloat(d.remaining_amount || d.amount).toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6B6459] font-medium">
                        {d.volunteer_name || (role === Role.ADMIN ? t.admin_role : role === Role.TREASURER ? t.treasurer_role : t.volunteer_role)}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#A8A297] whitespace-nowrap">
                        {new Date(d.created_at).toLocaleDateString(language === Language.ENGLISH ? 'en-IN' : 'mr-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        •{' '}
                        {new Date(d.created_at).toLocaleTimeString(language === Language.ENGLISH ? 'en-IN' : 'mr-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!d.is_voided && (parseFloat(d.remaining_amount) > 0 || d.payment_mode === 'PENDING' || d.payment_status === 'PARTIAL' || d.payment_status === 'PENDING') && (
                            <button
                              onClick={() => setCollectingDonation(d)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 transition cursor-pointer shadow-2xs"
                              title={t.collect_vargani}
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              <span>{t.collect_vargani}</span>
                            </button>
                          )}
                          <button
                            onClick={() => openReceipt(d)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#C2410C] bg-orange-50 hover:bg-orange-100/70 border border-orange-200/60 transition cursor-pointer shadow-2xs"
                            title={t.view_receipt}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.view}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-[#6B6459] text-sm">
                {searchTerm.trim() ? t.no_donations_match : t.no_donations_yet}
              </div>
            )}
          </div>
        </div>
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
