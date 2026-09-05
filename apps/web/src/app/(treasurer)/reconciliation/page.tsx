'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { Card, Input, Button, StatusBadge } from '@vargani/ui';
import { apiRequest } from '../../../lib/api-client';
import { getT } from '../../../lib/i18n';
import { DiscrepancyStatus, Role } from '@vargani/types';
import Link from 'next/link';
import {
  HandCoins,
  CheckCircle2,
  History,
  ShieldCheck,
} from 'lucide-react';

function ReconciliationContent() {
  const { activeMandal, role, token, language } = useAuth();
  const t = getT(language);
  const searchParams = useSearchParams();

  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>(
    searchParams.get('volunteerId') || ''
  );
  const [volunteerSummary, setVolunteerSummary] = useState<{
    donation_count: number;
    expected_cash_amount: number;
  } | null>(null);

  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [discrepancyReason, setDiscrepancyReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<any[]>([]);

  const fetchMembersAndHistory = async () => {
    if (activeMandal && token) {
      try {
        const members = await apiRequest<any[]>('/members');
        setVolunteers(members);
        const hist = await apiRequest<any[]>('/reconciliation/history');
        setHistory(hist);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    fetchMembersAndHistory();
  }, [activeMandal, token]);

  const fetchVolunteerSummary = async (volId: string) => {
    if (!volId || !activeMandal) return;
    try {
      const summary = await apiRequest<any>(`/reconciliation/volunteer-summary/${volId}`);
      setVolunteerSummary(summary);
      setReceivedAmount(String(summary.expected_cash_amount));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedVolunteerId) {
      fetchVolunteerSummary(selectedVolunteerId);
    }
  }, [selectedVolunteerId, activeMandal]);

  const handleVolunteerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const volId = e.target.value;
    setSelectedVolunteerId(volId);
    setSuccessMessage(null);
    setError(null);
  };

  const expected = volunteerSummary ? volunteerSummary.expected_cash_amount : 0;
  const received = parseFloat(receivedAmount) || 0;
  const discrepancy = received - expected;
  const hasDiscrepancy = Math.abs(discrepancy) > 0.001;

  const handleSubmitReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVolunteerId) {
      setError('कृपया कार्यकर्ता निवडा');
      return;
    }
    if (expected <= 0 && received <= 0) {
      setError('या कार्यकर्त्याकडे कोणतीही शिल्लक रोख रक्कम नाही');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await apiRequest<any>('/reconciliation/handover', {
        method: 'POST',
        body: JSON.stringify({
          volunteer_id: selectedVolunteerId,
          received_amount: received,
          discrepancy_reason: hasDiscrepancy ? discrepancyReason : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      setSuccessMessage(
        res.discrepancy_status === DiscrepancyStatus.NONE
          ? `₹${received.toLocaleString('en-IN')} रोख रक्कम यशस्वीरीत्या पडताळली व जमा केली!`
          : `हिशोब नोंदवला गेला (तफावत: ₹${discrepancy.toLocaleString('en-IN')})`
      );

      // Refresh data
      fetchVolunteerSummary(selectedVolunteerId);
      fetchMembersAndHistory();
      setDiscrepancyReason('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'हिशोब नोंदवण्यात त्रुटी आली');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveDiscrepancy = async (recId: string, newStatus: DiscrepancyStatus) => {
    try {
      await apiRequest(`/reconciliation/${recId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchMembersAndHistory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] pb-16">
      <Header />
      <OfflineBanner />

      {/* Nav */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[#E5E1D8]/80 px-4 py-2 sticky top-[53px] z-20 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <Link href="/dashboard" className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118] transition">
            {t.dashboard}
          </Link>
          <Link href="/reconciliation" className="px-3 py-1.5 rounded-xl bg-[#7C2D12] text-white font-bold shadow-2xs">
            {t.reconciliation}
          </Link>
          <Link href="/expenses" className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118] transition">
            {t.expenses}
          </Link>
          <Link href="/members" className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118] transition">
            {t.members}
          </Link>
          <Link href="/reports" className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118] transition">
            {t.reports}
          </Link>
          {role === Role.ADMIN && (
            <Link href="/settings" className="px-3 py-1.5 rounded-xl text-[#6B6459] hover:bg-[#FAF9F6] hover:text-[#292118] transition">
              {t.settings}
            </Link>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto w-full px-4 pt-6 flex-1 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#292118]">{t.reconciliation} (Cash Handover)</h2>
          <p className="text-xs text-[#6B6459] mt-0.5">
            कार्यकर्त्यांकडून खजिनदारांकडे रोख वर्गणी जमा करून घेणे आणि पावत्यांचा ताळमेळ बसवणे.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Handover Form */}
          <Card variant="default" padding="lg" className="shadow-sm border border-[#E5E1D8]">
            <h3 className="text-base font-bold text-[#292118] mb-4 flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-[#F97316]" />
              <span>नवीन रोख जमा नोंदवा</span>
            </h3>

            <form onSubmit={handleSubmitReconciliation} className="space-y-4">
              {/* Select Volunteer */}
              <div className="space-y-1 text-left">
                <label className="text-sm font-medium text-[#292118]">कार्यकर्ता निवडा (Select Volunteer)</label>
                <select
                  value={selectedVolunteerId}
                  onChange={handleVolunteerChange}
                  className="w-full min-h-[48px] rounded-xl border-2 border-[#E5E1D8] bg-white px-3.5 text-base text-[#292118] focus:border-[#F97316] focus:outline-none"
                  required
                >
                  <option value="">-- कार्यकर्ता निवडा --</option>
                  {volunteers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected vs Actual Box */}
              {selectedVolunteerId && volunteerSummary && (
                <div className="p-4 rounded-xl bg-[#F3F1EC] border border-[#E5E1D8] space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#6B6459]">एकूण शिल्लक पावत्या:</span>
                    <strong className="text-[#292118] font-bold">{volunteerSummary.donation_count} पावत्या</strong>
                  </div>

                  <div className="flex justify-between items-center border-t border-[#E5E1D8] pt-2">
                    <span className="text-xs font-semibold text-[#6B6459]">{t.expected_amount}:</span>
                    <span className="text-lg font-black text-[#292118]">
                      ₹{expected.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <Input
                    label="प्रत्यक्षात खजिनदारांस प्राप्त रोख रक्कम (₹)"
                    type="number"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    required
                  />

                  {/* Discrepancy indicator */}
                  <div
                    className={`p-2.5 rounded-lg text-xs font-bold flex items-center justify-between ${
                      hasDiscrepancy
                        ? discrepancy < 0
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <span>{t.discrepancy}:</span>
                    <span>
                      {discrepancy === 0
                        ? '₹0 (अचूक ताळमेळ / Matched)'
                        : `${discrepancy > 0 ? '+' : ''}₹${discrepancy.toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  {hasDiscrepancy && (
                    <Input
                      label="तफावतीचे कारण (Reason for Discrepancy)"
                      placeholder="उदा. चिल्लर शिल्लक, पुढील फेरीत जमा करणार"
                      value={discrepancyReason}
                      onChange={(e) => setDiscrepancyReason(e.target.value)}
                      required
                    />
                  )}

                  <Input
                    label="टीप / शेरा (Optional Notes)"
                    placeholder="उदा. ५०० च्या नोटा १०"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                disabled={!selectedVolunteerId}
                className="font-bold gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{t.confirm_handover}</span>
              </Button>
            </form>
          </Card>

          {/* Quick Guide Card */}
          <div className="space-y-4">
            <Card variant="flat" padding="md" className="border border-[#E5E1D8]">
              <h4 className="text-sm font-bold text-[#292118] mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>हिशोब पडताळणी नियमावली</span>
              </h4>
              <ul className="text-xs text-[#6B6459] space-y-2 list-disc list-inside">
                <li>कार्यकर्त्याने ऑनलाइन किंवा ऑफलाइन फाडलेल्या सर्व <strong>CASH</strong> पावत्या आपोआप येथे जमा रकमेसाठी एकत्र मोजल्या जातात.</li>
                <li>खजिनदारांनी प्रत्यक्षात रोख मोजून घेतल्यानंतर <strong>Confirm</strong> करावे.</li>
                <li>कोणतीही तफावत असल्यास ती <strong>Open Discrepancy</strong> म्हणून नोंदवली जाते आणि नंतर सोडवता येते.</li>
                <li>पडताळणी झाल्यानंतर त्या पावत्यांचे रेकॉर्ड्स लॉक होतात.</li>
              </ul>
            </Card>

            <Card variant="default" padding="md" className="border border-[#E5E1D8]">
              <h4 className="text-sm font-bold text-[#292118] mb-1">UPI व बँक पावत्या</h4>
              <p className="text-xs text-[#6B6459]">
                UPI आणि बँक ट्रान्सफरची रक्कम थेट मंडळाच्या बँक खात्यात येत असल्याने त्यासाठी रोख handover ची गरज नसते.
              </p>
            </Card>
          </div>
        </div>

        {/* Reconciliation History Table */}
        <Card variant="default" padding="none" className="shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E5E1D8] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#292118] flex items-center gap-2">
              <History className="w-4 h-4 text-[#F97316]" />
              <span>मागील हिशोब पडताळणी इतिहास (Reconciliation Logs)</span>
            </h3>
            <span className="text-xs text-[#6B6459] font-medium">{history.length} नोंदी</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F3F1EC] text-[#6B6459] font-bold text-xs uppercase border-b border-[#E5E1D8]">
                <tr>
                  <th className="px-4 py-3">तारीख व वेळ</th>
                  <th className="px-4 py-3">कार्यकर्ता</th>
                  <th className="px-4 py-3">खजिनदार</th>
                  <th className="px-4 py-3 text-right">अपेक्षित</th>
                  <th className="px-4 py-3 text-right">प्राप्त रोख</th>
                  <th className="px-4 py-3 text-center">स्थिती (Status)</th>
                  <th className="px-4 py-3 text-center">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#A8A297]">
                      अद्याप कोणतीही पडताळणी झालेली नाही
                    </td>
                  </tr>
                ) : (
                  history.map((h) => {
                    const disc = parseFloat(h.discrepancy_amount);
                    return (
                      <tr key={h.id} className="hover:bg-orange-50/20 transition">
                        <td className="px-4 py-3 text-[#6B6459]">
                          {new Date(h.created_at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#292118]">{h.volunteer_name}</td>
                        <td className="px-4 py-3 text-[#6B6459]">{h.treasurer_name}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{parseFloat(h.expected_amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#292118]">₹{parseFloat(h.received_amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-center">
                          {h.discrepancy_status === 'NONE' ? (
                            <StatusBadge status="success" label="Matched" size="sm" />
                          ) : h.discrepancy_status === 'OPEN' ? (
                            <StatusBadge status="error" label={`फरक: ₹${disc}`} size="sm" />
                          ) : (
                            <StatusBadge status="info" label={h.discrepancy_status} size="sm" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {h.discrepancy_status === 'OPEN' && (
                            <button
                              onClick={() => handleResolveDiscrepancy(h.id, DiscrepancyStatus.RESOLVED)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 transition"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}

export default function ReconciliationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F97316]"></div>
        </div>
      }
    >
      <ReconciliationContent />
    </Suspense>
  );
}
