'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { Card, Button } from '@vargani/ui';
import { apiRequest, downloadFile } from '../../../lib/api-client';
import { getT } from '../../../lib/i18n';
import { TreasurerOverview, Role } from '@vargani/types';
import Link from 'next/link';
import {
  FileSpreadsheet,
  FileText,
  ExternalLink,
  Download,
  IndianRupee,
  ShieldCheck,
  Building,
  Upload,
  CheckCircle2,
  Share2,
} from 'lucide-react';

export default function ReportsPage() {
  const { activeMandal, role, language, token, isLoading: authLoading } = useAuth();
  const t = getT(language);
  const router = useRouter();

  const [overview, setOverview] = useState<TreasurerOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingDonations, setIsExportingDonations] = useState(false);
  const [isExportingExpenses, setIsExportingExpenses] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Access Control: Admin and Treasurer only
  useEffect(() => {
    if (!authLoading && role && role === Role.VOLUNTEER) {
      router.replace('/history');
    }
  }, [role, authLoading, router]);

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
      await downloadFile('/reports/donations/csv', `donations-${activeMandal?.slug || 'mandal'}-${Date.now()}.csv`, token);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Donations export failed');
    } finally {
      setIsExportingDonations(false);
    }
  };

  const handleExportExpenses = async () => {
    try {
      setIsExportingExpenses(true);
      await downloadFile('/reports/expenses/csv', `expenses-${activeMandal?.slug || 'mandal'}-${Date.now()}.csv`, token);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Expenses export failed');
    } finally {
      setIsExportingExpenses(false);
    }
  };

  const transparencyUrl = typeof window !== 'undefined' && activeMandal?.slug 
    ? `${window.location.origin}/mandal/${activeMandal.slug}/transparency` 
    : '';

  const handleCopyTransparencyLink = () => {
    if (transparencyUrl) {
      navigator.clipboard.writeText(transparencyUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] pb-16">
      <Header />
      <OfflineBanner />

      {/* Sub-Navigation Bar */}
      <div className="bg-white border-b border-[#E5E1D8] px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center justify-between overflow-x-auto gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC] transition"
            >
              {t.dashboard}
            </Link>
            <Link
              href="/reconciliation"
              className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC] transition"
            >
              {t.reconciliation}
            </Link>
            <Link
              href="/expenses"
              className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC] transition"
            >
              {t.expenses}
            </Link>
            <Link
              href="/members"
              className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC] transition"
            >
              {t.members}
            </Link>
            <Link
              href="/reports"
              className="px-3 py-1.5 rounded-lg bg-orange-50 text-[#F97316] font-bold border border-orange-200"
            >
              {t.reports}
            </Link>
            {role === Role.ADMIN && (
              <Link
                href="/settings"
                className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC] transition"
              >
                {t.settings}
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto w-full px-4 py-6 flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#292118] tracking-tight">
            अहवाल व डेटा निर्यात (Reports & Data Exports)
          </h1>
          <p className="text-xs text-[#6B6459] mt-1">
            मंडळाचा वार्षिक अहवाल, जमा-खर्च हिशोब, CSV निर्यात आणि सार्वजनिक पारदर्शकता पत्रक.
          </p>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="default" padding="md" className="border-t-4 border-t-[#F97316] shadow-xs">
            <span className="text-xs font-bold text-[#6B6459] uppercase tracking-wider">एकूण जमा (Collections)</span>
            <p className="text-2xl font-black text-[#292118] mt-1">
              ₹{(overview?.festival_total_collected || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              रोख ₹{(overview?.total_cash_collected || 0).toLocaleString('en-IN')} • UPI ₹{(overview?.total_upi_collected || 0).toLocaleString('en-IN')}
            </p>
          </Card>

          <Card variant="default" padding="md" className="border-t-4 border-t-red-600 shadow-xs">
            <span className="text-xs font-bold text-[#6B6459] uppercase tracking-wider">एकूण खर्च (Expenses)</span>
            <p className="text-2xl font-black text-red-700 mt-1">
              ₹{(overview?.total_approved_expenses || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-[#6B6459] mt-1">मंजूर अधिकृत बिले</p>
          </Card>

          <Card variant="default" padding="md" className="border-t-4 border-t-emerald-600 shadow-xs bg-gradient-to-br from-white to-emerald-50/40">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">निव्वळ शिल्लक निधी (Net Balance)</span>
            <p className="text-2xl font-black text-emerald-800 mt-1">
              ₹{(overview?.net_balance || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">हिशोब प्रमाणित</p>
          </Card>
        </div>

        {/* Official Ahwal Section */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/20">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  मंडळाचा अधिकृत अहवाल
                </span>
                <h3 className="text-lg font-black mt-1">
                  {activeMandal?.ahwal_title || 'वार्षिक अहवाल व जमा-खर्च हिशोब'}
                </h3>
                <p className="text-xs text-teal-100 mt-0.5">
                  {activeMandal?.ahwal_url
                    ? 'अहवाल फाईल अपलोड झालेली असून भाविकांसाठी सार्वजनिक उपलब्ध आहे.'
                    : 'अद्याप अधिकृत अहवाल फाईल अपलोड केलेली नाही.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {activeMandal?.ahwal_url ? (
                <a
                  href={activeMandal.ahwal_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 text-xs font-black flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Download className="w-4 h-4 text-teal-700" />
                  <span>अहवाल पहा / डाउनलोड करा</span>
                </a>
              ) : role === Role.ADMIN ? (
                <Link
                  href="/settings"
                  className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 text-xs font-black flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Upload className="w-4 h-4 text-teal-700" />
                  <span>अहवाल अपलोड करा (Settings)</span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* CSV Data Exports Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Donations CSV Card */}
          <Card variant="default" padding="lg" className="shadow-xs space-y-4 border border-[#E5E1D8]">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#F97316] flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#292118]">वर्गणी देणगी अहवाल (Donations CSV)</h3>
                <p className="text-xs text-[#6B6459] mt-0.5">
                  सर्व देणग्यांची पावतीनिहाय यादी, देणगीदारांचे नाव, मोबाईल, माध्यम, तारीख व गोळा करणाऱ्या कार्यकर्त्याचे नाव.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={handleExportDonations}
                isLoading={isExportingDonations}
                className="font-bold gap-2 text-[#7C2D12] hover:bg-orange-50 border-[#F97316]/40"
              >
                <Download className="w-4 h-4 text-[#F97316]" />
                <span>वर्गणी लेजर डाउनलोड करा (CSV)</span>
              </Button>
            </div>
          </Card>

          {/* Expenses CSV Card */}
          <Card variant="default" padding="lg" className="shadow-xs space-y-4 border border-[#E5E1D8]">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#292118]">खर्च अहवाल (Expenses CSV)</h3>
                <p className="text-xs text-[#6B6459] mt-0.5">
                  सर्व उत्सवातील खर्चांची बिले, वर्गीकरण (मंडप, ध्वनी, प्रसाद, इ.), मंजूर करणारी व्यक्ती व तपशील.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={handleExportExpenses}
                isLoading={isExportingExpenses}
                className="font-bold gap-2 text-red-700 hover:bg-red-50 border-red-300"
              >
                <Download className="w-4 h-4 text-red-600" />
                <span>खर्च लेजर डाउनलोड करा (CSV)</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Public Transparency Portal Card */}
        {activeMandal?.slug && (
          <Card variant="default" padding="lg" className="shadow-xs border border-[#E5E1D8] space-y-4 bg-gradient-to-tr from-white via-orange-50/20 to-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#292118]">सार्वजनिक पारदर्शकता पोर्टल (Public Transparency)</h3>
                  <p className="text-xs text-[#6B6459] mt-0.5">
                    भाविकांना व देणगीदारांना मंडळाचा संपूर्ण डिजिटल हिशोब पाहण्यासाठी ही लिंक शेअर करा.
                  </p>
                  <p className="text-xs font-semibold text-[#F97316] mt-1 break-all">
                    {transparencyUrl}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyTransparencyLink}
                  className="font-semibold gap-1.5 flex-1 sm:flex-initial"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>कॉपी झाले!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>लिंक कॉपी करा</span>
                    </>
                  )}
                </Button>

                <Link
                  href={`/mandal/${activeMandal.slug}/transparency`}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F97316] text-white hover:bg-[#EA580C] text-xs font-bold shadow-xs transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>पोर्टल उघडा</span>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
