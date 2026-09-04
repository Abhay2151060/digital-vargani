'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Input, Button, Card, Modal } from '@vargani/ui';
import { Role } from '@vargani/types';
import Link from 'next/link';
import { User, Lock, Eye, EyeOff, ArrowRight, Home, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';
import { getT } from '../../../lib/i18n';

export default function LoginPage() {
  const { user, role, isLoading: authLoading, login, changePassword, language } = useAuth();
  const t = getT(language);
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // First login password change modal state
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [changePassError, setChangePassError] = useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!authLoading && user && role && !showChangeModal) {
      redirectToRolePage(role);
    }
  }, [user, role, authLoading, showChangeModal]);

  const redirectToRolePage = (userRole?: string | null) => {
    const activeRole = userRole || localStorage.getItem('vargani_role');
    if (activeRole === Role.VOLUNTEER) {
      router.replace('/history');
    } else if (activeRole === Role.TREASURER || activeRole === Role.ADMIN) {
      router.replace('/dashboard');
    } else {
      router.replace('/history');
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!username.trim()) {
      setError('कृपया युझरनेम किंवा मोबाईल नंबर टाका');
      return;
    }
    if (!password) {
      setError('कृपया पासवर्ड टाका');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (res.mustChangePassword) {
        setCurrentPassword(password);
        setShowChangeModal(true);
      } else {
        redirectToRolePage();
      }
    } catch (err: any) {
      setError(err.message || 'लॉगिन अयशस्वी झाले (Login failed)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setChangePassError('नवीन पासवर्ड किमान ६ अक्षरांचा असावा');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePassError('दोन्ही पासवर्ड जुळत नाहीत');
      return;
    }

    setChangePassError(null);
    setIsChangingPass(true);
    try {
      await changePassword(currentPassword, newPassword);
      setShowChangeModal(false);
      redirectToRolePage();
    } catch (err: any) {
      setChangePassError(err.message || 'पासवर्ड बदलताना त्रुटी आली');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleSkipPasswordChange = () => {
    setShowChangeModal(false);
    redirectToRolePage();
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#292118]" suppressHydrationWarning>
              {mounted ? t.login_title : 'मंडळ लॉगिन'}
            </h2>
            <span className="text-[11px] font-semibold text-[#8C827A] bg-[#F3F1EC] px-2.5 py-1 rounded-full border border-[#E5E1D8]">
              पासवर्ड लॉगिन
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <Input
                label={mounted ? t.username_label || 'युझरनेम किंवा मोबाईल नंबर' : 'युझरनेम किंवा मोबाईल नंबर'}
                type="text"
                placeholder={mounted ? t.username_placeholder || 'उदा. abhay किंवा 8421692967' : 'उदा. abhay किंवा 8421692967'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <div className="relative">
                <Input
                  label={mounted ? t.password_label || 'पासवर्ड (Password)' : 'पासवर्ड (Password)'}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mounted ? t.password_placeholder || 'आपला पासवर्ड टाका' : 'आपला पासवर्ड टाका'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-[#8C827A] hover:text-[#292118] p-1 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[#8C827A] mt-1.5 flex items-center gap-1">
                <span>💡</span>
                <span>{mounted ? t.default_password_hint : 'नवीन युझर्ससाठी डिफॉल्ट पासवर्ड: user123'}</span>
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="font-bold gap-2 shadow-md shadow-orange-500/20"
            >
              <span>{mounted ? t.login_btn || 'लॉगिन करा' : 'लॉगिन करा'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-4 pt-3 border-t border-[#E5E1D8] text-center">
            <p className="text-[11px] text-[#8C827A]">
              नवीन खाते तयार करण्यासाठी कृपया आपल्या मंडळाच्या अध्यक्षांशी (Admin) संपर्क साधा.
            </p>
          </div>
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

      {/* First-Login Password Change Modal */}
      <Modal
        isOpen={showChangeModal}
        onClose={handleSkipPasswordChange}
        title={mounted ? t.change_password_title || 'पहिल्या लॉगिनसाठी पासवर्ड बदला' : 'पहिल्या लॉगिनसाठी पासवर्ड बदला'}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <ShieldCheck className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">सुरक्षा सूचना</p>
              <p className="mt-0.5 text-amber-700">
                {mounted ? t.change_password_desc : 'सुरक्षेसाठी कृपया आपला डिफॉल्ट पासवर्ड बदलून नवीन पासवर्ड सेट करा.'}
              </p>
            </div>
          </div>

          {changePassError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {changePassError}
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
            <Input
              label={mounted ? t.current_password || 'चालू पासवर्ड' : 'चालू पासवर्ड'}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="relative">
              <Input
                label={mounted ? t.new_password || 'नवीन पासवर्ड (किमान ६ अक्षरे)' : 'नवीन पासवर्ड (किमान ६ अक्षरे)'}
                type={showNewPassword ? 'text' : 'password'}
                placeholder="उदा. MyPass@2026"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<KeyRound className="w-4 h-4" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-[38px] text-[#8C827A] hover:text-[#292118] p-1 transition"
                aria-label="Toggle password view"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              label={mounted ? t.confirm_new_password || 'नवीन पासवर्ड पुन्हा टाका' : 'नवीन पासवर्ड पुन्हा टाका'}
              type="password"
              placeholder="नवीन पासवर्ड पुन्हा टाका"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
            />

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                isLoading={isChangingPass}
                className="font-bold"
              >
                {mounted ? t.update_password_btn || 'पासवर्ड बदला व पुढे जा' : 'पासवर्ड बदला व पुढे जा'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                fullWidth
                onClick={handleSkipPasswordChange}
              >
                नंतर बदला (Skip)
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
