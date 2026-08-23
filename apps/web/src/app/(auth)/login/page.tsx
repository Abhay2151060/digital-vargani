'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Input, Button, Card } from '@vargani/ui';
import { apiRequest } from '../../../lib/api-client';
import { Sparkles, Phone, KeyRound, ArrowRight, UserCheck } from 'lucide-react';
import { getT } from '../../../lib/i18n';

export default function LoginPage() {
  const { user, role, isLoading: authLoading, login, language } = useAuth();
  const t = getT(language);
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!authLoading && user && role) {
      router.replace('/');
    }
  }, [user, role, authLoading, router]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError(t.enter_phone);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const res = await apiRequest<any>('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
        setOtp(res.devOtp); // Auto-fill for convenience in dev
      }
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError(t.enter_otp);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await login(phone, otp, fullName || undefined);
      const userRole = localStorage.getItem('vargani_role');
      if (userRole === Role.VOLUNTEER) {
        router.replace('/collect');
      } else if (userRole === Role.TREASURER || userRole === Role.ADMIN) {
        router.replace('/dashboard');
      } else {
        router.replace('/collect');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoPhone: string, demoName: string) => {
    setPhone(demoPhone);
    setFullName(demoName);
    setOtp('123456');
    setStep('otp');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-[#FAF9F6]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6" suppressHydrationWarning>
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C2410C] to-[#F97316] items-center justify-center text-white text-2xl font-bold shadow-lg shadow-orange-500/25 mb-3">
            🚩
          </div>
          <h1 className="text-2xl font-extrabold text-[#292118] tracking-tight" suppressHydrationWarning>
            {mounted ? t.app_title : 'डिजिटल वर्गणी'}
          </h1>
          <p className="text-xs text-[#6B6459] mt-1" suppressHydrationWarning>
            {mounted ? t.tagline : 'उत्सव आणि सार्वजनिक मंडळांसाठी डिजिटल पावती व निधी व्यवस्थापन'}
          </p>
        </div>

        {/* Login Card */}
        <Card variant="default" padding="lg" className="shadow-lg" suppressHydrationWarning>
          <h2 className="text-lg font-bold text-[#292118] mb-4" suppressHydrationWarning>
            {step === 'phone'
              ? (mounted ? t.login_title : 'मंडळ लॉगिन')
              : 'ओटीपी सत्यापन (Verify OTP)'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <Input
                label="मोबाईल नंबर (Mobile Number)"
                type="tel"
                maxLength={10}
                placeholder="उदा. 9822012345"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                leftIcon={<Phone className="w-4 h-4" />}
                required
              />

              <Input
                label="पूर्ण नाव (Name) - नवीन युजर्ससाठी"
                type="text"
                placeholder="आपले पूर्ण नाव टाका"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<UserCheck className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                className="font-bold gap-2"
              >
                <span>{t.get_otp}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex justify-between items-center text-xs text-[#6B6459]">
                <span>ओटीपी पाठवला: <strong>+91 {phone}</strong></span>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-[#F97316] font-semibold hover:underline"
                >
                  बदला (Change)
                </button>
              </div>

              <Input
                label="६ अंकी ओटीपी (Enter 6-digit OTP)"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                leftIcon={<KeyRound className="w-4 h-4" />}
                helperText={devOtpHint ? `Dev OTP: ${devOtpHint}` : 'डेव्हलपमेंटसाठी 123456 वापरा'}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                className="font-bold gap-2"
              >
                <span>{t.verify_login}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* Quick Demo Logins for Pair Programming / Review */}
          <div className="mt-6 pt-5 border-t border-[#E5E1D8]">
            <p className="text-xs font-semibold text-[#6B6459] mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>डेमो लॉगिन (Quick Demo Roles):</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('9876543212', 'Amit Kadam (Volunteer)')}
                className="p-2 rounded-xl border border-[#E5E1D8] bg-[#F3F1EC] hover:bg-orange-50 hover:border-orange-300 text-[11px] font-semibold text-[#292118] text-center transition"
              >
                कार्यकर्ता<br /><span className="text-[9px] text-[#6B6459] font-normal">Volunteer</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('9876543211', 'Rahul Deshmukh (Treasurer)')}
                className="p-2 rounded-xl border border-[#E5E1D8] bg-[#F3F1EC] hover:bg-orange-50 hover:border-orange-300 text-[11px] font-semibold text-[#292118] text-center transition"
              >
                खजिनदार<br /><span className="text-[9px] text-[#6B6459] font-normal">Treasurer</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('9876543210', 'Sachin Patil (Admin)')}
                className="p-2 rounded-xl border border-[#E5E1D8] bg-[#F3F1EC] hover:bg-orange-50 hover:border-orange-300 text-[11px] font-semibold text-[#292118] text-center transition"
              >
                अध्यक्ष/Admin<br /><span className="text-[9px] text-[#6B6459] font-normal">Admin</span>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
