'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Input, Button, Card } from '@vargani/ui';
import { Role } from '@vargani/types';
import Link from 'next/link';
import { Phone, ArrowRight, UserCheck, Home, ArrowLeft } from 'lucide-react';
import { getT } from '../../../lib/i18n';

export default function LoginPage() {
  const { user, role, isLoading: authLoading, login, language } = useAuth();
  const t = getT(language);
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!authLoading && user && role) {
      router.replace('/');
    }
  }, [user, role, authLoading, router]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError(t.enter_phone);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await login(phone, fullName || undefined);
      const userRole = localStorage.getItem('vargani_role');
      if (userRole === Role.VOLUNTEER) {
        router.replace('/history');
      } else if (userRole === Role.TREASURER || userRole === Role.ADMIN) {
        router.replace('/dashboard');
      } else {
        router.replace('/history');
      }
    } catch (err: any) {
      setError(err.message || 'लॉगिन अयशस्वी झाले (Login failed)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-[#FAF9F6] relative">
      {/* Top Back to Home Button */}
      <div className="w-full max-w-md flex justify-start mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B6459] hover:text-[#C2410C] bg-white hover:bg-[#F3F1EC] px-3 py-1.5 rounded-xl border border-[#E5E1D8] shadow-2xs transition"
        >
          <ArrowLeft className="w-4 h-4 text-[#F97316]" />
          <span>मुख्यपृष्ठ (Home)</span>
        </Link>
      </div>

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
            {mounted ? t.login_title : 'मंडळ लॉगिन'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
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
              placeholder="आपले नाव टाका (नवीन असल्यास)"
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
              className="font-bold gap-2 shadow-md shadow-orange-500/20"
            >
              <span>{t.login_btn || 'लॉगिन करा'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </Card>

        {/* Bottom Home Page Navigation Link */}
        <div className="mt-5 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-xs font-bold text-[#6B6459] hover:text-[#C2410C] bg-white hover:bg-[#F3F1EC] px-4 py-2.5 rounded-2xl border border-[#E5E1D8] shadow-2xs transition w-full"
          >
            <Home className="w-4 h-4 text-[#F97316]" />
            <span>होम पेजवर जा (Go to Home Page)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
