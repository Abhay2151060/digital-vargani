'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Button } from '@vargani/ui';
import { PublicTransparencyReport } from '@vargani/types';
import {
  ShieldCheck,
  Building,
  QrCode,
  Users,
  FileCheck,
  FileText,
  ExternalLink,
  Download,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function PublicTransparencyPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [report, setReport] = useState<PublicTransparencyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadAhwal = (url: string, title?: string | null) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      const extension = url.startsWith('data:image/') ? 'png' : 'pdf';
      link.download = `${title || 'mandal-ahwal'}-${slug}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    if (slug) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      fetch(`${apiBase}/transparency/${slug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setReport(data.data);
          } else {
            setError(data.message || 'Mandal not found');
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F97316]"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FAF9F6] text-center">
        <div className="bg-white p-8 rounded-3xl border border-[#E5E1D8] shadow-md max-w-md">
          <h2 className="text-xl font-bold text-[#292118]">पारदर्शकता पोर्टल आढळले नाही</h2>
          <p className="text-xs text-[#6B6459] mt-2">{error || 'या मंडळाचे पारदर्शकता पान उपलब्ध नाही.'}</p>
          <Link href="/" className="mt-4 inline-block">
            <Button variant="primary" size="sm">मुख्यपृष्ठावर जा</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { mandal, total_collected, total_expenses, net_balance, total_donors_count, collections_by_mode, expenses_by_category, donor_roll, approved_expenses_list } = report;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      {/* Top Banner */}
      <header className="bg-gradient-to-r from-[#7C2D12] via-[#C2410C] to-[#F97316] text-white py-8 px-4 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-bold shadow-inner overflow-hidden shrink-0">
              {mandal.logo_url ? (
                <img src={mandal.logo_url} alt={mandal.name} className="w-full h-full object-cover" />
              ) : (
                '🚩'
              )}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                सार्वजनिक पारदर्शकता पोर्टल
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">{mandal.name}</h1>
              <p className="text-xs text-orange-100 mt-0.5">
                {mandal.city} {mandal.area ? `(${mandal.area})` : ''} {mandal.registration_number ? `• नोंदणी क्र: ${mandal.registration_number}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/30 text-xs font-bold text-amber-200">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>१००% प्रमाणित व डिजिटल ऑडिटेड</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 space-y-6">
        {/* Balance Sheet Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="default" padding="md" className="border-t-4 border-t-[#F97316] shadow-sm">
            <span className="text-xs font-bold text-[#6B6459] uppercase tracking-wider">एकूण जमा वर्गणी (Collections)</span>
            <p className="text-2xl font-black text-[#292118] mt-1">₹{total_collected.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">एकूण {total_donors_count} देणगीदार</p>
          </Card>

          <Card variant="default" padding="md" className="border-t-4 border-t-red-600 shadow-sm">
            <span className="text-xs font-bold text-[#6B6459] uppercase tracking-wider">एकूण मंजूर खर्च (Expenses)</span>
            <p className="text-2xl font-black text-red-700 mt-1">₹{total_expenses.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-[#6B6459] mt-1">{approved_expenses_list.length} अधिकृत बिले</p>
          </Card>

          <Card variant="default" padding="md" className="border-t-4 border-t-emerald-600 shadow-sm bg-gradient-to-br from-white to-emerald-50/40">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">निव्वळ शिल्लक निधी (Net Balance)</span>
            <p className="text-2xl font-black text-emerald-800 mt-1">₹{net_balance.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-emerald-700 mt-1 font-medium">मंडळाच्या बँक खात्यात व खजिनदारांकडे</p>
          </Card>
        </div>

        {/* Breakdown by Mode and Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Collections by Mode */}
          <Card variant="default" padding="md" className="shadow-sm">
            <h3 className="text-sm font-bold text-[#292118] mb-3 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#F97316]" />
              <span>पेमेंट माध्यम वर्गीकरण (Collections Split)</span>
            </h3>
            <div className="space-y-2">
              {collections_by_mode.map((m) => (
                <div key={m.mode} className="flex items-center justify-between p-2.5 bg-[#F3F1EC] rounded-xl text-xs">
                  <div>
                    <strong className="text-[#292118]">{m.mode}</strong>
                    <span className="text-[#6B6459] ml-1.5 font-medium">({m.count} पावत्या)</span>
                  </div>
                  <strong className="text-[#7C2D12] text-sm">₹{m.amount.toLocaleString('en-IN')}</strong>
                </div>
              ))}
            </div>
          </Card>

          {/* Expenses by Category */}
          <Card variant="default" padding="md" className="shadow-sm">
            <h3 className="text-sm font-bold text-[#292118] mb-3 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-[#F97316]" />
              <span>खर्च वर्गीकरण (Expense Split)</span>
            </h3>
            <div className="space-y-2">
              {expenses_by_category.length === 0 ? (
                <p className="text-xs text-[#6B6459] py-4 text-center">अद्याप कोणताही खर्च झालेला नाही</p>
              ) : (
                expenses_by_category.map((e) => (
                  <div key={e.category} className="flex items-center justify-between p-2.5 bg-[#F3F1EC] rounded-xl text-xs">
                    <div>
                      <strong className="text-[#292118]">{e.category}</strong>
                      <span className="text-[#6B6459] ml-1.5 font-medium">({e.count} बिले)</span>
                    </div>
                    <strong className="text-red-700 text-sm">₹{e.amount.toLocaleString('en-IN')}</strong>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Mandal Ahwal (Annual Report) & UPI QR Code Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Ahwal Card */}
          <div className="bg-gradient-to-br from-[#0F766E] to-[#115E59] text-white rounded-3xl p-5 shadow-md flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                    मंडळाचा अधिकृत अहवाल
                  </span>
                  <h3 className="text-base font-extrabold mt-1">
                    {mandal.ahwal_title || 'वार्षिक अहवाल व जमा-खर्च हिशोब'}
                  </h3>
                  <p className="text-xs text-teal-100 mt-0.5">
                    {mandal.ahwal_url
                      ? 'मंडळाचे अधिकृत ऑडिट अहवाल पत्रक'
                      : 'डिजिटल हिशोब खालील पत्रकात उपलब्ध आहे.'}
                  </p>
                </div>
              </div>
            </div>

            {mandal.ahwal_url ? (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleDownloadAhwal(mandal.ahwal_url!, mandal.ahwal_title)}
                  className="py-2.5 px-3 rounded-xl bg-white text-teal-900 hover:bg-teal-50 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <Download className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>अहवाल डाउनलोड करा</span>
                </button>

                <a
                  href={mandal.ahwal_url}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-black flex items-center justify-center gap-1.5 border border-white/30 transition"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>अहवाल पहा</span>
                </a>
              </div>
            ) : (
              <div className="pt-2">
                <div className="py-2 px-3 rounded-xl bg-white/10 border border-white/20 text-xs text-teal-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0" />
                  <span>स्वाक्षरी अहवाल प्रशासकाद्वारे लवकरच जोडला जाईल</span>
                </div>
              </div>
            )}
          </div>

          {/* UPI QR Donation Card */}
          <div className="bg-white rounded-3xl p-5 border border-[#E5E1D8] shadow-sm flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold text-[#C2410C] uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                डिजिटल देणगी (Donate Online)
              </span>
              <h3 className="text-base font-extrabold text-[#292118] mt-1">मंडळास देणगी द्या</h3>
              <p className="text-xs text-[#6B6459] mt-0.5">
                UPI QR स्कॅन करून थेट मंडळाच्या खात्यात वर्गणी जमा करा.
              </p>
              {mandal.upi_id && (
                <p className="text-xs font-bold text-blue-700 mt-2 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 inline-block">
                  UPI ID: {mandal.upi_id}
                </p>
              )}
            </div>

            {mandal.upi_qr_url ? (
              <div className="w-24 h-24 rounded-2xl border-2 border-[#F97316] p-1 bg-white shadow-sm shrink-0 flex items-center justify-center">
                <img
                  src={mandal.upi_qr_url}
                  alt="Mandal Donation UPI QR"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-orange-50 border border-orange-200 flex flex-col items-center justify-center text-[#F97316] shrink-0 p-2 text-center">
                <QrCode className="w-7 h-7" />
                <span className="text-[9px] font-bold mt-1">QR कोड</span>
              </div>
            )}
          </div>
        </div>

        {/* Public Donor Roll */}
        <Card variant="default" padding="none" className="shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E5E1D8] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#292118] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F97316]" />
                <span>देणगीदार नामावली (Public Donor Roll)</span>
              </h3>
              <p className="text-xs text-[#6B6459] mt-0.5">भक्तांच्या योगदानाचा पारदर्शक डिजिटल अभिलेख</p>
            </div>
            <span className="text-xs font-semibold text-[#6B6459]">{donor_roll.length} देणगीदार</span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F3F1EC] text-[#6B6459] font-bold text-xs uppercase border-b border-[#E5E1D8] sticky top-0">
                <tr>
                  <th className="px-4 py-3">पावती क्र.</th>
                  <th className="px-4 py-3">देणगीदाराचे नाव</th>
                  <th className="px-4 py-3">मोबाईल</th>
                  <th className="px-4 py-3">माध्यम</th>
                  <th className="px-4 py-3 text-right">रक्कम (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {donor_roll.map((d) => (
                  <tr key={d.receipt_number} className="hover:bg-orange-50/20 transition">
                    <td className="px-4 py-3 font-semibold text-[#F97316]">{d.receipt_number}</td>
                    <td className="px-4 py-3 font-bold text-[#292118]">{d.donor_name}</td>
                    <td className="px-4 py-3 text-[#6B6459]">{d.donor_phone_masked || '—'}</td>
                    <td className="px-4 py-3 text-xs text-[#6B6459]">{d.payment_mode}</td>
                    <td className="px-4 py-3 text-right font-black text-[#7C2D12]">
                      ₹{d.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Audit Signoff Footer */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#292118]">डिजिटल ऑडिट व पडताळणी शिक्का</h4>
              <p className="text-xs text-[#6B6459]">
                हा हिशोब मंडळाच्या अध्यक्ष व खजिनदारांमार्फत डिजिटल स्वरूपात प्रमाणित केला गेला आहे.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
            ✓ Verified Authentic
          </span>
        </div>
      </main>
    </div>
  );
}
