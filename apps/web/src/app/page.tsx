'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Role } from '@vargani/types';
import {
  Sparkles,
  ShieldCheck,
  Smartphone,
  HeartHandshake,
  ArrowRight,
  Zap,
  Lock,
  Share2,
  Users,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { Button } from '@vargani/ui';
import Link from 'next/link';

export default function HomePage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && user && role) {
      if (role === Role.VOLUNTEER) {
        router.replace('/collect');
      } else if (role === Role.TREASURER || role === Role.ADMIN) {
        router.replace('/dashboard');
      }
    }
  }, [user, role, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6]">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C2410C] to-[#F97316] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-orange-500/30 animate-bounce mb-3">
          🚩
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#F97316] border-t-transparent mb-2"></div>
        <p className="text-xs font-semibold text-[#6B6459]">डिजिटल वर्गणी लोड होत आहे...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF9F6] text-[#292118] selection:bg-orange-500 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-400/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl"></div>
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full bg-white/85 backdrop-blur-lg border-b border-[#E5E1D8] px-4 sm:px-8 py-3.5 shadow-2xs transition">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C2410C] to-[#F97316] flex items-center justify-center text-white text-xl font-black shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform">
              🚩
            </div>
            <div>
              <span className="font-black text-xl text-[#292118] tracking-tight block leading-none">
                डिजिटल वर्गणी
              </span>
              <span className="text-[10px] font-bold text-[#F97316] tracking-wide uppercase">
                Digital Vargani Platform
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/mandal/shivneri-mitra-mandal/transparency">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#6B6459] hover:text-[#C2410C] transition px-3 py-1.5 rounded-xl hover:bg-[#F3F1EC]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>पारदर्शकता पोर्टल</span>
              </span>
            </Link>
            <Link href="/login">
              <Button
                variant="primary"
                size="md"
                className="font-bold shadow-md shadow-orange-500/20 bg-gradient-to-r from-[#C2410C] to-[#F97316] hover:from-[#9A3412] hover:to-[#EA580C] text-xs sm:text-sm px-4 py-2"
              >
                <span>मंडळ लॉगिन</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 flex flex-col items-center text-center">
        {/* Top Highlight Tag */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100/90 to-amber-100/90 text-[#9A3412] border border-orange-200/80 px-4 py-2 rounded-full text-xs font-extrabold shadow-xs mb-6 backdrop-blur-xs">
          <Sparkles className="w-4 h-4 text-[#F97316] animate-pulse" />
          <span>गणेशोत्सव, नवरात्र व सार्वजनिक मंडळांसाठी #१ डिजिटल व्यासपीठ</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-black text-[#292118] tracking-tight leading-[1.15] max-w-3xl">
          कागदी पावत्या बंद करा, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#C2410C] via-[#F97316] to-[#D97706] bg-clip-text text-transparent">
            डिजिटल वर्गणी
          </span> सुरू करा!
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-xl text-[#6B6459] max-w-2xl font-medium leading-relaxed">
          १० सेकंदांत डिजिटल पावती, थेट व्हॉट्सॲप वर शेअरिंग, रोख हिशोब पडताळणी आणि १००% सार्वजनिक पारदर्शकता.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="font-extrabold text-base px-8 py-4 shadow-xl shadow-orange-500/30 bg-gradient-to-r from-[#C2410C] to-[#F97316] hover:from-[#9A3412] hover:to-[#EA580C] gap-2 rounded-2xl min-h-[54px]"
            >
              <span>वर्गणी नोंदणी सुरू करा</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>

          <Link href="/mandal/shivneri-mitra-mandal/transparency" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              fullWidth
              className="font-bold text-sm px-6 py-4 bg-white border-[#E5E1D8] text-[#292118] hover:bg-[#F3F1EC] gap-2 rounded-2xl shadow-xs min-h-[54px]"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>डेमो पारदर्शकता पोर्टल</span>
            </Button>
          </Link>
        </div>

        {/* Trust Badges Bar */}
        <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-6 bg-white/80 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-[#E5E1D8] shadow-md w-full max-w-2xl">
          <div className="text-center">
            <div className="text-xl sm:text-3xl font-black text-[#C2410C]">१० सेकंद</div>
            <div className="text-[11px] sm:text-xs font-semibold text-[#6B6459] mt-0.5">तात्काळ पावती</div>
          </div>
          <div className="text-center border-x border-[#E5E1D8] px-2">
            <div className="text-xl sm:text-3xl font-black text-emerald-700">१००%</div>
            <div className="text-[11px] sm:text-xs font-semibold text-[#6B6459] mt-0.5">पारदर्शक हिशोब</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-3xl font-black text-blue-700">व्हॉट्सॲप</div>
            <div className="text-[11px] sm:text-xs font-semibold text-[#6B6459] mt-0.5">थेट शेअरिंग</div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-16 text-left w-full">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E1D8] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-xs">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-[#292118]">१० सेकंदांत डिजिटल पावती</h3>
            <p className="text-xs text-[#6B6459] mt-2 leading-relaxed font-medium">
              कोणताही अ‍ॅप इन्स्टॉल न करता कोणत्याही मोबाईल ब्राऊझरवरून ऑनलाइन व ऑफलाइन तात्काळ डिजिटल पावती बनवा.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] font-bold text-orange-800">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                <span>व्हॉट्सॲप मेसेज व PDF पावती</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                <span>QR कोड पडताळणी</span>
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E1D8] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-[#292118]">रोख हishोब पडताळणी</h3>
            <p className="text-xs text-[#6B6459] mt-2 leading-relaxed font-medium">
              प्रत्येक कार्यकर्त्याकडील जमा रोख रक्कमेचा आणि पावत्यांचा खजिनदारांसोबत एका क्लिकवर अचूक ताळमेळ.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] font-bold text-emerald-800">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>झिरो कॅश तफावत</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>खजिनदार हँडओव्हर रिपोर्ट</span>
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E1D8] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-[#292118]">सार्वजनिक पारदर्शकता</h3>
            <p className="text-xs text-[#6B6459] mt-2 leading-relaxed font-medium">
              भक्तांसाठी आणि सभासदांसाठी मंडळाच्या जमा, खर्च व दैनंदिन हिशोबाचे १००% रिअल-टाईम पारदर्शक पोर्टल.
            </p>
            <ul className="mt-4 space-y-1.5 text-[11px] font-bold text-blue-800">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>सार्वजनिक अहवाल (PDF/Excel)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>भक्तांचा वाढता विश्वास</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Dynamic Demo Roles Banner */}
        <div className="mt-16 bg-gradient-to-br from-[#292118] to-[#1C1917] text-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full text-left relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-orange-500/20 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full mb-3">
                <Users className="w-3.5 h-3.5" />
                <span>3 मुख्य भूमिका (Demo Roles)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                मंडळातील सर्वांसाठी सोपी प्रणाली
              </h2>
              <p className="text-xs sm:text-sm text-[#A8A29E] mt-1 max-w-xl">
                कार्यकर्ता, खजिनदार आणि अध्यक्षांसाठी स्वतंत्र सोपी वैशिष्ट्ये. आजच आपल्या मंडळासाठी टेस्ट करा!
              </p>
            </div>

            <Link href="/login">
              <Button
                variant="primary"
                size="lg"
                className="font-extrabold text-sm px-6 py-3 bg-gradient-to-r from-[#C2410C] to-[#F97316] hover:from-[#9A3412] hover:to-[#EA580C] shadow-lg shadow-orange-500/30 whitespace-nowrap rounded-xl"
              >
                <span>डेमो लॉगिन करा</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-[#6B6459] border-t border-[#E5E1D8] bg-white relative z-10">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#C2410C] to-[#F97316] flex items-center justify-center text-white text-xs font-bold">
              🚩
            </div>
            <span className="font-extrabold text-sm text-[#292118]">डिजिटल वर्गणी</span>
          </div>

          <p>© 2024 Digital Vargani. गणेशोत्सव व सार्वजनिक मंडळांसाठी समर्पित व्यवस्थापन प्रणाली.</p>

          <Link href="/login" className="text-xs font-bold text-[#F97316] hover:underline">
            मंडळ लॉगिन →
          </Link>
        </div>
      </footer>
    </div>
  );
}
