'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { Card, Input, Button } from '@vargani/ui';
import { apiRequest } from '../../../lib/api-client';
import { getT } from '../../../lib/i18n';
import { FestivalType, Role, UpdateMandalProfileInput, Language } from '@vargani/types';
import Link from 'next/link';
import { Save, CheckCircle2, Upload, Trash2, Sparkles, Image as ImageIcon, QrCode, FileText, ExternalLink, FileCheck, User, KeyRound, AlertCircle, Building, Copy, ShieldCheck } from 'lucide-react';
import { formatDisplayName } from '../../../lib/format';

export default function SettingsPage() {
  const { user, role, activeMandal, language, setLanguage, updateActiveMandal, changePassword, isLoading: authLoading } = useAuth();
  const t = getT(language);
  const router = useRouter();
  const userDisplayName = formatDisplayName(user?.full_name || (user as any)?.fullName) || 'व्यवस्थापक';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const ahwalFileInputRef = useRef<HTMLInputElement>(null);

  // Tab State: Mandal Profile vs User Profile
  const [settingsTab, setSettingsTab] = useState<'mandal' | 'user'>('mandal');

  // User Profile Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState<string | null>(null);
  const [passErrorMsg, setPassErrorMsg] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg(null);
    setPassSuccessMsg(null);

    if (!currentPassword) {
      setPassErrorMsg('कृपया सध्याचा पासवर्ड टाका.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPassErrorMsg('नवीन पासवर्ड किमान ६ अक्षरांचा असावा.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassErrorMsg('दोन्ही नवीन पासवर्ड जुळत नाहीत.');
      return;
    }

    setIsChangingPass(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPassSuccessMsg('पासवर्ड यशस्वीरित्या बदलला आहे!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassErrorMsg(err.message || 'पासवर्ड बदलताना त्रुटी आली.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Enforce Admin Only Access
  useEffect(() => {
    if (!authLoading && role && role !== Role.ADMIN) {
      if (role === Role.TREASURER) {
        router.replace('/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [role, authLoading, router]);

  const [name, setName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [festivalType, setFestivalType] = useState<FestivalType>(FestivalType.GANESHOTSAV);
  const [receiptPrefix, setReceiptPrefix] = useState('G');
  const [upiId, setUpiId] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [ahwalUrl, setAhwalUrl] = useState('');
  const [ahwalTitle, setAhwalTitle] = useState('वार्षिक अहवाल व जमा-खर्च हिशोब');
  const [presetAmountsStr, setPresetAmountsStr] = useState('101, 251, 501, 1001, 2101, 5001');
  const [hidePhoneNumbers, setHidePhoneNumbers] = useState(true);
  const [slug, setSlug] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [isUploadingAhwal, setIsUploadingAhwal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeMandal) {
      setName(activeMandal.name || '');
      setRegNo(activeMandal.registration_number || '');
      setCity(activeMandal.city || '');
      setArea(activeMandal.area || '');
      setFestivalType(activeMandal.festival_type || FestivalType.GANESHOTSAV);
      setReceiptPrefix(activeMandal.receipt_prefix || 'G');
      setUpiId(activeMandal.upi_id || '');
      setLogoUrl(activeMandal.logo_url || '');
      setUpiQrUrl(activeMandal.upi_qr_url || '');
      setAhwalUrl(activeMandal.ahwal_url || '');
      setAhwalTitle(activeMandal.ahwal_title || 'वार्षिक अहवाल व जमा-खर्च हिशोब');
      setPresetAmountsStr((activeMandal.preset_amounts || [101, 251, 501, 1001, 2101, 5001]).join(', '));
      setHidePhoneNumbers(activeMandal.hide_phone_numbers ?? true);
      setSlug(activeMandal.slug || '');
    }
  }, [activeMandal]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('कृपया केवळ इमेज फाईल (PNG, JPG, JPEG, WEBP) निवडा.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('इमेज फाईल साईज ८ MB पेक्षा कमी असावी.');
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to clean square bounds (max 400x400) to keep it crisp, fast & lightweight
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/png', 0.9);
          setLogoUrl(compressedDataUrl);
        } else {
          setLogoUrl(event.target?.result as string);
        }
        setIsUploadingImage(false);
      };
      img.onerror = () => {
        setError('इमेज लोड करण्यात अडचण आली.');
        setIsUploadingImage(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setError('फाईल वाचण्यात अडचण आली.');
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // QR Code Upload Handler
  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('कृपया केवळ QR कोड इमेज फाईल (PNG, JPG, JPEG, WEBP) निवडा.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('QR कोड इमेज साईज ८ MB पेक्षा कमी असावी.');
      return;
    }

    setIsUploadingQr(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 500;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setUpiQrUrl(canvas.toDataURL('image/png', 0.9));
        } else {
          setUpiQrUrl(event.target?.result as string);
        }
        setIsUploadingQr(false);
      };
      img.onerror = () => {
        setError('QR कोड लोड करण्यात अडचण आली.');
        setIsUploadingQr(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setError('फाईल वाचण्यात अडचण आली.');
      setIsUploadingQr(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = () => {
    setUpiQrUrl('');
    if (qrFileInputRef.current) {
      qrFileInputRef.current.value = '';
    }
  };

  // Ahwal (Report Document / PDF / Image) Upload Handler
  const handleAhwalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setError('अहवाल फाईल साईज २५ MB पेक्षा कमी असावी.');
      return;
    }

    setIsUploadingAhwal(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1600;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setAhwalUrl(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            setAhwalUrl(result);
          }
          setIsUploadingAhwal(false);
        };
        img.onerror = () => {
          setAhwalUrl(result);
          setIsUploadingAhwal(false);
        };
        img.src = result;
      } else {
        setAhwalUrl(result);
        setIsUploadingAhwal(false);
      }
    };
    reader.onerror = () => {
      setError('अहवाल फाईल वाचण्यात अडचण आली.');
      setIsUploadingAhwal(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAhwal = () => {
    setAhwalUrl('');
    if (ahwalFileInputRef.current) {
      ahwalFileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('मंडळाचे नाव आवश्यक आहे');
      return;
    }

    const amounts = presetAmountsStr
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    setError(null);
    setIsSaving(true);
    try {
      const payload: UpdateMandalProfileInput = {
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || null,
        registration_number: regNo.trim() || null,
        city: city.trim(),
        area: area.trim() || null,
        festival_type: festivalType,
        receipt_prefix: receiptPrefix.trim() || 'G',
        logo_url: logoUrl.trim() || null,
        upi_id: upiId.trim() || null,
        upi_qr_url: upiQrUrl.trim() || null,
        ahwal_url: ahwalUrl.trim() || null,
        ahwal_title: ahwalTitle.trim() || 'वार्षिक अहवाल व जमा-खर्च हिशोब',
        preset_amounts: amounts.length > 0 ? amounts : [101, 251, 501, 1001, 2101, 5001],
        hide_phone_numbers: hidePhoneNumbers,
      };

      const updated = await apiRequest<any>('/mandals/current', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setSuccessMsg('मंडळ माहिती, लोगो, QR कोड व अहवाल यशस्वीरीत्या सेव्ह झाले!');
      updateActiveMandal(updated);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'सेटिंग्ज सेव्ह करण्यात अडचण आली');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || (role && role !== Role.ADMIN)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F97316]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] pb-16" suppressHydrationWarning>
      <Header />
      <OfflineBanner />

      {/* Nav */}
      <div className="bg-white border-b border-[#E5E1D8] px-4 py-2" suppressHydrationWarning>
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC]">
            {t.dashboard}
          </Link>
          <Link href="/reconciliation" className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC]">
            {t.reconciliation}
          </Link>
          <Link href="/expenses" className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC]">
            {t.expenses}
          </Link>
          <Link href="/members" className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC]">
            {t.members}
          </Link>
          <Link href="/reports" className="px-3 py-1.5 rounded-lg text-[#6B6459] hover:bg-[#F3F1EC]">
            {t.reports}
          </Link>
          {role === Role.ADMIN && (
            <Link href="/settings" className="px-3 py-1.5 rounded-lg bg-orange-50 text-[#F97316] font-bold border border-orange-200">
              {t.settings}
            </Link>
          )}
        </div>
      </div>

      <main className="max-w-3xl mx-auto w-full px-4 pt-6 flex-1 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#292118]">{t.settings}</h2>
          <p className="text-xs text-[#6B6459] mt-0.5">
            {language === Language.ENGLISH
              ? 'Manage mandal name, logo, registration number, receipt prefix, and transparency settings.'
              : 'मंडळाचे नाव, लोगो, नोंदणी क्रमांक, पावती प्रिफिक्स आणि पारदर्शकता पर्याय व्यवस्थापित करा.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Settings Tabs: Mandal Profile vs User Profile */}
        <div className="flex items-center gap-2 border-b border-[#E5E1D8] pb-3">
          <button
            type="button"
            onClick={() => setSettingsTab('mandal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              settingsTab === 'mandal'
                ? 'bg-[#7C2D12] text-white shadow-2xs'
                : 'bg-[#F3F1EC] text-[#6B6459] hover:text-[#292118]'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>{t.mandal_profile}</span>
          </button>
          <button
            type="button"
            onClick={() => setSettingsTab('user')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              settingsTab === 'user'
                ? 'bg-[#7C2D12] text-white shadow-2xs'
                : 'bg-[#F3F1EC] text-[#6B6459] hover:text-[#292118]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t.user_profile}</span>
          </button>
        </div>

        {settingsTab === 'mandal' && (
          <Card variant="default" padding="lg" className="shadow-sm border border-[#E5E1D8]">
            <form onSubmit={handleSave} className="space-y-5">
            {/* Logo Upload Section */}
            <div className="p-4 bg-[#F8F7F4] rounded-2xl border border-[#E5E1D8] space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {/* Logo Preview Avatar */}
                  <div className="relative group w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#C2410C] to-[#F97316] flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20 overflow-hidden border-2 border-white shrink-0">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Mandal Logo Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Sparkles className="w-8 h-8 text-amber-200" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#292118] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#F97316]" />
                      <span>{t.mandal_logo}</span>
                    </h3>
                    <p className="text-xs text-[#6B6459] mt-0.5">
                      {t.mandal_logo_sub}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-md border border-orange-200">
                      {logoUrl ? `✓ ${t.custom_logo_selected}` : `🚩 ${t.default_logo_active}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    className="hidden"
                    id="mandal-logo-input"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={isUploadingImage}
                    className="font-semibold gap-1.5 flex-1 sm:flex-initial"
                  >
                    <Upload className="w-4 h-4 text-[#F97316]" />
                    <span>{logoUrl ? t.change_logo : t.upload_logo}</span>
                  </Button>

                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold gap-1"
                      title={t.remove}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.remove}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* UPI QR Code Upload Section */}
            <div className="p-4 bg-[#F8F7F4] rounded-2xl border border-[#E5E1D8] space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {/* QR Preview Box */}
                  <div className="relative group w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 overflow-hidden border-2 border-white shrink-0 bg-white">
                    {upiQrUrl ? (
                      <img
                        src={upiQrUrl}
                        alt="UPI QR Code Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <QrCode className="w-8 h-8 text-white" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#292118] flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-blue-600" />
                      <span>{t.mandal_qr}</span>
                    </h3>
                    <p className="text-xs text-[#6B6459] mt-0.5">
                      {t.mandal_qr_sub}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200">
                      {upiQrUrl ? `✓ ${t.qr_uploaded}` : `⚠️ ${t.qr_not_uploaded}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="file"
                    ref={qrFileInputRef}
                    onChange={handleQrFileChange}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    id="mandal-qr-input"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => qrFileInputRef.current?.click()}
                    isLoading={isUploadingQr}
                    className="font-semibold gap-1.5 flex-1 sm:flex-initial"
                  >
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{upiQrUrl ? t.change_qr : t.upload_qr}</span>
                  </Button>

                  {upiQrUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveQr}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold gap-1"
                      title={t.remove}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.remove}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Ahwal (Annual / Audit Report) Upload Section */}
            <div className="p-4 bg-[#F8F7F4] rounded-2xl border border-[#E5E1D8] space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20 overflow-hidden border-2 border-white shrink-0">
                    <FileText className="w-8 h-8 text-emerald-100" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#292118] flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>{t.mandal_ahwal_title || (language === Language.ENGLISH ? 'Mandal Report' : 'मंडळाचा अहवाल')}</span>
                    </h3>
                    <p className="text-xs text-[#6B6459] mt-0.5">
                      {t.mandal_ahwal_sub || (language === Language.ENGLISH ? 'Annual income-expense report / statement (PDF or image).' : 'मंडळाचा वार्षिक जमा-खर्च अहवाल / पत्रक (PDF किंवा इमेज स्वरूपात).')}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                      {ahwalUrl ? `✓ ${t.ahwal_uploaded || (language === Language.ENGLISH ? 'Report file uploaded' : 'अहवाल फाईल अपलोड आहे')}` : `⚠️ ${t.ahwal_not_uploaded || (language === Language.ENGLISH ? 'Report not uploaded' : 'अहवाल अपलोड केलेला नाही')}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="file"
                    ref={ahwalFileInputRef}
                    onChange={handleAhwalFileChange}
                    accept="application/pdf,image/png,image/jpeg,image/jpg"
                    className="hidden"
                    id="mandal-ahwal-input"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => ahwalFileInputRef.current?.click()}
                    isLoading={isUploadingAhwal}
                    className="font-semibold gap-1.5 flex-1 sm:flex-initial"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>{ahwalUrl ? (t.change_ahwal || (language === Language.ENGLISH ? 'Change Report' : 'अहवाल बदला')) : (t.upload_ahwal || (language === Language.ENGLISH ? 'Upload Report' : 'अहवाल निवडा'))}</span>
                  </Button>

                  {ahwalUrl && (
                    <>
                      <a
                        href={ahwalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg border border-emerald-300 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 min-h-[36px]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{t.view || (language === Language.ENGLISH ? 'View' : 'पहा')}</span>
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAhwal}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold gap-1"
                        title={language === Language.ENGLISH ? 'Remove report' : 'अहवाल काढा'}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.remove || (language === Language.ENGLISH ? 'Remove' : 'काढा')}</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Ahwal Title Input */}
              <div className="pt-2 border-t border-[#E5E1D8]/60">
                <Input
                  label={t.ahwal_title_label || (language === Language.ENGLISH ? 'Report Title / Description' : 'अहवाल शीर्षक / वर्णन')}
                  placeholder={language === Language.ENGLISH ? 'e.g. Annual Financial and Activities Report 2024-25' : 'उदा. वार्षिक अहवाल व जमा-खर्च हिशोब २०२४-२५'}
                  value={ahwalTitle}
                  onChange={(e) => setAhwalTitle(e.target.value)}
                />
              </div>
            </div>

            <Input
              label={t.mandal_name_label || (language === Language.ENGLISH ? 'Official Mandal Name' : 'मंडळाचे अधिकृत नाव')}
              placeholder={language === Language.ENGLISH ? 'e.g. Shree Samarth Mitra Mandal' : 'उदा. श्री समर्थ मित्र मंडळ'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {/* Public Transparency Portal Slug & Link */}
            <div className="bg-[#FFF7ED] border border-[#FDBA74]/70 rounded-2xl p-4 sm:p-5 space-y-3 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#C2410C]" />
                  <span className="text-sm font-bold text-[#7C2D12]">
                    {language === Language.ENGLISH ? 'Public Transparency Portal Link' : 'सार्वजनिक पारदर्शकता वेब लिंक (Public Portal)'}
                  </span>
                </div>
                {slug && (
                  <a
                    href={`/mandal/${slug}/transparency`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#C2410C] hover:underline"
                  >
                    <span>{language === Language.ENGLISH ? 'Open Portal' : 'पेज उघडा'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <Input
                label={language === Language.ENGLISH ? 'Portal URL Slug' : 'वेब स्लग (Portal Slug)'}
                placeholder="shree-samarth-mitra-mandal"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                helperText={
                  language === Language.ENGLISH
                    ? 'Only lowercase English letters, numbers, and hyphens.'
                    : 'केवळ लहान इंग्रजी अक्षरे, अंक आणि डॅश (-) वापरा.'
                }
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-white/90 border border-[#FDBA74]/50 rounded-xl px-3.5 py-2.5">
                <span className="text-xs font-mono text-[#7C2D12] break-all select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/mandal/${slug || '...'}/transparency` : `/mandal/${slug || '...'}/transparency`}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      navigator.clipboard.writeText(`${window.location.origin}/mandal/${slug}/transparency`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 3000);
                    }
                  }}
                  className="shrink-0 text-xs font-bold gap-1.5 h-8 px-3"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">{language === Language.ENGLISH ? 'Copied!' : 'कॉपी झाले!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#6B6459]" />
                      <span>{language === Language.ENGLISH ? 'Copy Link' : 'लिंक कॉपी करा'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t.reg_no_label || (language === Language.ENGLISH ? 'Registration / Trust No.' : 'नोंदणी क्रमांक')}
                placeholder="MH/2024/PUN/00912"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
              />

              <div className="space-y-1 text-left">
                <label className="text-sm font-medium text-[#292118]">{t.festival_type_label || (language === Language.ENGLISH ? 'Festival Type' : 'उत्सव प्रकार')}</label>
                <select
                  value={festivalType}
                  onChange={(e) => setFestivalType(e.target.value as FestivalType)}
                  className="w-full min-h-[48px] rounded-xl border-2 border-[#E5E1D8] bg-white px-3.5 text-base text-[#292118] focus:border-[#F97316] focus:outline-none"
                >
                  <option value={FestivalType.GANESHOTSAV}>{language === Language.ENGLISH ? 'Ganeshotsav' : 'गणेशोत्सव'}</option>
                  <option value={FestivalType.NAVRATRI}>{language === Language.ENGLISH ? 'Navratri' : 'नवरात्रौत्सव'}</option>
                  <option value={FestivalType.SHIV_JAYANTI}>{language === Language.ENGLISH ? 'Shiv Jayanti' : 'शिवजयंती'}</option>
                  <option value={FestivalType.DAHI_HANDI}>{language === Language.ENGLISH ? 'Dahi Handi' : 'दहीहंडी'}</option>
                  <option value={FestivalType.OTHER}>{language === Language.ENGLISH ? 'Other Festival' : 'इतर उत्सव'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t.city_label || (language === Language.ENGLISH ? 'City / Town' : 'गाव / शहर')}
                placeholder={language === Language.ENGLISH ? 'e.g. Pune' : 'उदा. पुणे'}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <Input
                label={t.area_label || (language === Language.ENGLISH ? 'Area / Landmark' : 'परिसर / गल्ली')}
                placeholder={language === Language.ENGLISH ? 'e.g. Kothrud, Shivaji Chowk' : 'उदा. कोथरूड, शिवाजी चौक'}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t.receipt_prefix_label || (language === Language.ENGLISH ? 'Receipt Prefix' : 'पावती प्रिफिक्स')}
                placeholder="SSMM"
                value={receiptPrefix}
                onChange={(e) => setReceiptPrefix(e.target.value.toUpperCase())}
                helperText={language === Language.ENGLISH ? 'e.g. Entering SSMM will generate receipts like SSMM-001.' : 'उदा. SSMM टाकल्यास पावती क्रमांक SSMM-001 असा बनेल.'}
                required
              />
              <Input
                label={language === Language.ENGLISH ? 'UPI ID / VPA (Optional)' : 'UPI ID / VPA (पर्यायी)'}
                placeholder="mandal@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>

            <Input
              label={t.preset_amounts_label || (language === Language.ENGLISH ? 'Preset Amount Chips (₹)' : 'क्विक-अमाऊंट चिप्स (₹)')}
              placeholder="101, 251, 501, 1001, 2101, 5001"
              value={presetAmountsStr}
              onChange={(e) => setPresetAmountsStr(e.target.value)}
              helperText={language === Language.ENGLISH ? 'Enter comma-separated amounts. These will appear on volunteers receipt screens.' : 'स्वल्पविराम देऊन रक्कम टाका, हे कार्यकर्त्यांच्या स्क्रीनवर दिसतील.'}
            />

            {/* Privacy Setting */}
            <div className="p-4 bg-[#F3F1EC] rounded-xl border border-[#E5E1D8] flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-[#292118]">{t.privacy_setting_title || (language === Language.ENGLISH ? 'Public Transparency Privacy' : 'सार्वजनिक पारदर्शकता गोपनीयता')}</span>
                <p className="text-xs text-[#6B6459] mt-0.5">
                  {t.privacy_setting_sub || (language === Language.ENGLISH ? 'Keep donor phone numbers masked on transparency portal (e.g. 98220*****).' : 'पारदर्शकता पोर्टलवर देणगीदारांचे मोबाईल नंबर गोपनीय ठेवा (उदा. ९८२२०*****)')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={hidePhoneNumbers}
                onChange={(e) => setHidePhoneNumbers(e.target.checked)}
                className="w-5 h-5 text-[#F97316] rounded cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSaving}
                className="font-bold gap-2 cursor-pointer"
              >
                <Save className="w-5 h-5" />
                <span>{t.save_settings || (language === Language.ENGLISH ? 'Save Settings' : 'सेटिंग्ज सेव्ह करा')}</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* USER PROFILE TAB */}
      {settingsTab === 'user' && (
        <div className="space-y-6">
          {/* User Details Card */}
          <Card variant="default" padding="lg" className="border border-[#E5E1D8] shadow-xs rounded-2xl space-y-5">
            <div className="flex items-center gap-3.5 pb-4 border-b border-[#E5E1D8]">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C2D12] via-[#C2410C] to-[#F97316] flex items-center justify-center text-white font-black text-2xl shadow-sm shadow-orange-500/20 shrink-0">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold text-[#292118] truncate">
                  {userDisplayName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-bold text-[#7C2D12] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                    {role === Role.ADMIN ? t.admin_role : role === Role.TREASURER ? t.treasurer_role : t.volunteer_role}
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
                <span className="text-[#6B6459] font-medium block">{t.full_name_label || (language === Language.ENGLISH ? 'Full Name' : 'पूर्ण नाव')}</span>
                <span className="font-bold text-[#292118] text-sm mt-0.5 block">
                  {userDisplayName}
                </span>
              </div>

              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E1D8]">
                <span className="text-[#6B6459] font-medium block">{t.mobile_label || (language === Language.ENGLISH ? 'Mobile Number' : 'मोबाईल नंबर')}</span>
                <span className="font-bold text-[#292118] text-sm mt-0.5 block font-mono">
                  {user?.phone || (language === Language.ENGLISH ? 'Not registered' : 'नोंदवलेला नाही')}
                </span>
              </div>

              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E1D8]">
                <span className="text-[#6B6459] font-medium block">{t.active_mandal_label || (language === Language.ENGLISH ? 'Active Mandal' : 'सक्रिय मंडळ')}</span>
                <span className="font-bold text-[#292118] text-sm mt-0.5 block truncate">
                  {activeMandal?.name || '—'}
                </span>
              </div>

              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E1D8]">
                <span className="text-[#6B6459] font-medium block">{t.preferred_language_label || (language === Language.ENGLISH ? 'Preferred Language' : 'भाषा')}</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="mt-1 bg-white border border-[#E5E1D8] rounded-lg px-2 py-1 text-xs font-semibold text-[#292118] focus:outline-none cursor-pointer"
                >
                  <option value="mr">मराठी</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Change Password Card */}
          <Card variant="default" padding="lg" className="border border-[#E5E1D8] shadow-xs rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#7C2D12]" />
              <h3 className="text-base font-bold text-[#292118]">{t.change_password || (language === Language.ENGLISH ? 'Change Password' : 'पासवर्ड बदला')}</h3>
            </div>
            <p className="text-xs text-[#6B6459]">
              {t.change_password_card_sub || (language === Language.ENGLISH ? 'Set a new password to keep your account secure.' : 'खाते सुरक्षित ठेवण्यासाठी नवीन पासवर्ड सेट करा.')}
            </p>

            {passSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passSuccessMsg}</span>
              </div>
            )}

            {passErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{passErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <Input
                label={t.current_password_label || (language === Language.ENGLISH ? 'Current Password' : 'सध्याचा पासवर्ड')}
                type="password"
                placeholder={language === Language.ENGLISH ? 'Enter current password' : 'सध्याचा पासवर्ड टाका'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <Input
                label={t.new_password_label || (language === Language.ENGLISH ? 'New Password (min 6 characters)' : 'नवीन पासवर्ड (किमान ६ अक्षरे)')}
                type="password"
                placeholder={language === Language.ENGLISH ? 'Enter new password' : 'नवीन पासवर्ड टाका'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label={t.confirm_new_password_label || (language === Language.ENGLISH ? 'Confirm New Password' : 'नवीन पासवर्ड पुन्हा टाका')}
                type="password"
                placeholder={language === Language.ENGLISH ? 'Re-enter new password' : 'नवीन पासवर्ड पुन्हा प्रविष्ट करा'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isChangingPass}
                className="font-bold cursor-pointer"
              >
                <span>{t.update_password_btn_label || (language === Language.ENGLISH ? 'Update Password' : 'पासवर्ड अपडेट करा')}</span>
              </Button>
            </form>
          </Card>
        </div>
      )}
      </main>
    </div>
  );
}
