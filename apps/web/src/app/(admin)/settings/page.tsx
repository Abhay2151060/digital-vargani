'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Header } from '../../../components/Header';
import { OfflineBanner } from '../../../components/OfflineBanner';
import { Card, Input, Button } from '@vargani/ui';
import { apiRequest } from '../../../lib/api-client';
import { getT } from '../../../lib/i18n';
import { FestivalType, Role, UpdateMandalProfileInput } from '@vargani/types';
import Link from 'next/link';
import { Save, CheckCircle2, Upload, Trash2, Sparkles, Image as ImageIcon, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const { user, role, activeMandal, language, updateActiveMandal, isLoading: authLoading } = useAuth();
  const t = getT(language);
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enforce Admin Only Access
  useEffect(() => {
    if (!authLoading && role && role !== Role.ADMIN) {
      if (role === Role.TREASURER) {
        router.replace('/dashboard');
      } else {
        router.replace('/collect');
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
  const [presetAmountsStr, setPresetAmountsStr] = useState('101, 251, 501, 1001, 2101, 5001');
  const [hidePhoneNumbers, setHidePhoneNumbers] = useState(true);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
      setPresetAmountsStr((activeMandal.preset_amounts || [101, 251, 501, 1001, 2101, 5001]).join(', '));
      setHidePhoneNumbers(activeMandal.hide_phone_numbers ?? true);
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
        registration_number: regNo.trim() || null,
        city: city.trim(),
        area: area.trim() || null,
        festival_type: festivalType,
        receipt_prefix: receiptPrefix.trim() || 'G',
        logo_url: logoUrl.trim() || null,
        upi_id: upiId.trim() || null,
        preset_amounts: amounts.length > 0 ? amounts : [101, 251, 501, 1001, 2101, 5001],
        hide_phone_numbers: hidePhoneNumbers,
      };

      const updated = await apiRequest<any>('/mandals/current', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setSuccessMsg('मंडळ माहिती व लोगो यशस्वीरीत्या सेव्ह झाले!');
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
          {role === Role.ADMIN && (
            <Link href="/settings" className="px-3 py-1.5 rounded-lg bg-orange-50 text-[#F97316] font-bold border border-orange-200">
              {t.settings}
            </Link>
          )}
        </div>
      </div>

      <main className="max-w-3xl mx-auto w-full px-4 pt-6 flex-1 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#292118]">{t.settings} (Mandal Profile)</h2>
          <p className="text-xs text-[#6B6459] mt-0.5">
            मंडळाचे नाव, लोगो, नोंदणी क्रमांक, पावती प्रिफिक्स आणि पारदर्शकता पर्याय व्यवस्थापित करा.
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
                      <span>मंडळाचा अधिकृत लोगो (Mandal Logo)</span>
                    </h3>
                    <p className="text-xs text-[#6B6459] mt-0.5">
                      हा लोगो हेडर, पावती व पारदर्शकता पोर्टलवर दिसेल.
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-md border border-orange-200">
                      {logoUrl ? '✓ कस्टम लोगो निवडला आहे' : '🚩 डीफॉल्ट आयकॉन सक्रिय'}
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
                    <span>{logoUrl ? 'लोगो बदला (Change)' : 'लोगो निवडा (Upload Logo)'}</span>
                  </Button>

                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold gap-1"
                      title="लोगो काढा"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">काढा</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Input
              label="मंडळाचे अधिकृत नाव (Mandal Name)"
              placeholder="उदा. श्री शिवनेरी मित्र मंडळ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="नोंदणी क्रमांक (Reg No / Trust No)"
                placeholder="MH/2024/PUN/00912"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
              />

              <div className="space-y-1 text-left">
                <label className="text-sm font-medium text-[#292118]">उत्सव प्रकार (Festival)</label>
                <select
                  value={festivalType}
                  onChange={(e) => setFestivalType(e.target.value as FestivalType)}
                  className="w-full min-h-[48px] rounded-xl border-2 border-[#E5E1D8] bg-white px-3.5 text-base text-[#292118] focus:border-[#F97316] focus:outline-none"
                >
                  <option value={FestivalType.GANESHOTSAV}>गणेशोत्सव (Ganeshotsav)</option>
                  <option value={FestivalType.NAVRATRI}>नवरात्रौत्सव (Navratri)</option>
                  <option value={FestivalType.SHIV_JAYANTI}>शिवजयंती (Shiv Jayanti)</option>
                  <option value={FestivalType.DAHI_HANDI}>दहीहंडी (Dahi Handi)</option>
                  <option value={FestivalType.OTHER}>इतर उत्सव (Other)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="गाव / शहर (City)"
                placeholder="उदा. पुणे"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <Input
                label="परिसर / गल्ली (Area / Landmark)"
                placeholder="उदा. कोथरूड, शिवाजी चौक"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="पावती प्रिफिक्स (Receipt Prefix)"
                placeholder="SSMM"
                value={receiptPrefix}
                onChange={(e) => setReceiptPrefix(e.target.value.toUpperCase())}
                helperText="उदा. SSMM टाकल्यास पावती क्रमांक SSMM-001 असा बनेल."
                required
              />
              <Input
                label="UPI ID / VPA (Optional)"
                placeholder="mandal@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>

            <Input
              label="क्विक-अमाऊंट चिप्स (Preset Amount Chips ₹)"
              placeholder="101, 251, 501, 1001, 2101, 5001"
              value={presetAmountsStr}
              onChange={(e) => setPresetAmountsStr(e.target.value)}
              helperText="स्वल्पविराम (comma) देऊन रक्कम टाका, हे कार्यकर्त्यांच्या स्क्रीनवर दिसतील."
            />

            {/* Privacy Setting */}
            <div className="p-4 bg-[#F3F1EC] rounded-xl border border-[#E5E1D8] flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-[#292118]">सार्वजनिक पारदर्शकता गोपनीयता</span>
                <p className="text-xs text-[#6B6459] mt-0.5">
                  पारदर्शकता पोर्टलवर देणगीदारांचे मोबाईल नंबर गोपनीय ठेवा (उदा. 98220*****)
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
                className="font-bold gap-2"
              >
                <Save className="w-5 h-5" />
                <span>सेटिंग्ज सेव्ह करा</span>
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
