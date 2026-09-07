'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Card, Input, Button } from '@vargani/ui';
import { getT } from '../../lib/i18n';
import { Role, Language } from '@vargani/types';
import Link from 'next/link';
import { formatDisplayName } from '../../lib/format';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Building,
  Phone,
  Globe,
  Lock,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, activeMandal, role, language, setLanguage, changePassword } = useAuth();
  const t = getT(language);
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getDashboardHref = () => {
    if (role === Role.VOLUNTEER) return '/dashboard';
    return '/dashboard';
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg('कृपया सध्याचा पासवर्ड प्रविष्ट करा.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('नवीन पासवर्ड किमान ६ अक्षरांचा असावा.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('दोन्ही नवीन पासवर्ड जुळत नाहीत.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMsg('पासवर्ड यशस्वीरित्या बदलला आहे!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'पासवर्ड बदलताना त्रुटी आली.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] pb-16">
      <Header />
      <OfflineBanner />

      <main className="max-w-xl mx-auto w-full px-4 pt-6 flex-1 space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href={getDashboardHref()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7C2D12] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>डॅशबोर्डवर परत जा</span>
          </Link>
          <span className="text-xs font-semibold text-[#6B6459] bg-[#F3F1EC] px-2.5 py-1 rounded-full border border-[#E5E1D8]">
            User Profile
          </span>
        </div>

        {/* Profile Details Card */}
        <Card variant="default" padding="lg" className="border border-[#E5E1D8] shadow-xs rounded-2xl space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-[#E5E1D8]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C2D12] via-[#C2410C] to-[#F97316] flex items-center justify-center text-white font-black text-2xl shadow-sm shadow-orange-500/20 shrink-0">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-[#292118] truncate">
                {formatDisplayName(user?.full_name) || 'वापरकर्ता'}
              </h2>
              <p className="text-xs text-[#6B6459] font-mono">@{user?.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-[#7C2D12] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  {role}
                </span>
                {activeMandal?.name && (
                  <span className="text-xs text-[#6B6459] truncate">
                    • {activeMandal.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E1D8]">
              <span className="text-[#6B6459] font-medium block">युझरनेम (Username)</span>
              <span className="font-bold text-[#292118] text-sm mt-0.5 block font-mono">
                {user?.username || '—'}
              </span>
            </div>

            <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E1D8]">
              <span className="text-[#6B6459] font-medium block">मोबाईल नंबर (Phone)</span>
              <span className="font-bold text-[#292118] text-sm mt-0.5 block font-mono">
                {user?.phone || 'नोंदवलेला नाही'}
              </span>
            </div>

            <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E1D8]">
              <span className="text-[#6B6459] font-medium block">सक्रिय मंडळ (Mandal)</span>
              <span className="font-bold text-[#292118] text-sm mt-0.5 block truncate">
                {activeMandal?.name || '—'}
              </span>
            </div>

            <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E1D8]">
              <span className="text-[#6B6459] font-medium block">भाषा (Preferred Language)</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="mt-1 bg-white border border-[#E5E1D8] rounded-lg px-2 py-1 text-xs font-semibold text-[#292118] focus:outline-none"
              >
                <option value={Language.MARATHI}>मराठी (Marathi)</option>
                <option value={Language.ENGLISH}>English</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card variant="default" padding="lg" className="border border-[#E5E1D8] shadow-xs rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#7C2D12]" />
            <h3 className="text-base font-bold text-[#292118]">पासवर्ड बदला (Change Password)</h3>
          </div>
          <p className="text-xs text-[#6B6459]">
            आपला खाते सुरक्षित ठेवण्यासाठी नवीन पासवर्ड सेट करा.
          </p>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <Input
              label="सध्याचा पासवर्ड (Current Password)"
              type="password"
              placeholder="सध्याचा पासवर्ड टाका"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              label="नवीन पासवर्ड (New Password - किमान ६ अक्षरे)"
              type="password"
              placeholder="नवीन पासवर्ड टाका"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <Input
              label="नवीन पासवर्ड पुन्हा टाका (Confirm New Password)"
              type="password"
              placeholder="नवीन पासवर्ड पुन्हा प्रविष्ट करा"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              className="font-bold cursor-pointer"
            >
              <span>पासवर्ड अपडेट करा</span>
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
