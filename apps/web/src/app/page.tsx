'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Role } from '@vargani/types';
import {
  Sparkles,
  ShieldCheck,
  Smartphone,
  HeartHandshake,
  ArrowRight,
  Share2,
  Users,
  CheckCircle2,
  ChevronRight,
  QrCode,
  BadgeCheck
} from 'lucide-react';
import { Button } from '@vargani/ui';
import Link from 'next/link';

export default function HomePage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'volunteer' | 'treasurer' | 'public'>('volunteer');

  useEffect(() => {
    if (!isLoading && user && role) {
      if (role === Role.VOLUNTEER) {
        router.replace('/history');
      } else if (role === Role.TREASURER || role === Role.ADMIN) {
        router.replace('/dashboard');
      }
    }
  }, [user, role, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6]">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C2410C] to-[#F97316] flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-orange-500/30 animate-bounce mb-3">
          🚩
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#F97316] border-t-transparent mb-2"></div>
        <p className="text-xs font-bold text-[#6B6459]">डिजिटल वर्गणी लोड होत आहे...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF9F6] text-[#292118] selection:bg-orange-500 selection:text-white font-sans overflow-x-hidden">
      {/* Dynamic Ambient Background Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-gradient-to-br from-orange-400/20 to-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-[450px] h-[450px] bg-gradient-to-tr from-amber-500/15 to-orange-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full glass-panel px-4 sm:px-8 py-3.5 shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C2D12] via-[#C2410C] to-[#F97316] flex items-center justify-center text-white text-xl font-black shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              🚩
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl text-[#292118] tracking-tight block leading-none">
                  डिजिटल वर्गणी
                </span>
                <span className="text-[10px] font-bold text-[#C2410C] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/80">
                  Digital Vargani
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#6B6459] tracking-wide block mt-0.5">
                उत्सव व मंडळ व्यवस्थापन व्यासपीठ
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/mandal/shivneri-mitra-mandal/transparency">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6459] hover:text-[#7C2D12] transition px-3.5 py-2 rounded-xl hover:bg-[#F3F1EC] border border-[#E5E1D8]/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>सार्वजनिक पारदर्शकता</span>
              </span>
            </Link>

            <Link href="/login">
              <Button
                variant="primary"
                size="sm"
                className="font-bold text-xs sm:text-sm px-4 py-2 rounded-xl"
              >
                <span>मंडळ लॉगिन</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-14 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-flex items-center gap-2 bg-[#FFF7ED] text-[#C2410C] border border-[#FDBA74]/60 px-4 py-1.5 rounded-full text-xs font-bold shadow-2xs mb-5">
              <span className="text-[#C2410C] font-semibold">॥ श्री गणेशाय नमः ॥</span>
              <span className="w-1 h-1 rounded-full bg-[#C2410C]"></span>
              <span>पारदर्शक उत्सव व्यवस्थापन</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#292118] tracking-tight leading-[1.12]">
              कागदी पावत्या बंद करा, <br />
              <span className="bg-gradient-to-r from-[#7C2D12] via-[#C2410C] to-[#F97316] bg-clip-text text-transparent">
                डिजिटल वर्गणी
              </span> सुरू करा!
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#6B6459] max-w-xl font-normal leading-relaxed">
              १० सेकंदांत डिजिटल पावती, थेट व्हॉट्सॲप द्वारे पावती वितरण, कार्यकर्त्यांचा रोख हिशोब आणि १००% सार्वजनिक पारदर्शकता.
            </p>

            {/* Main Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="font-bold text-base px-8 py-3.5 gap-2 rounded-2xl min-h-[52px]"
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
                  className="font-semibold text-sm px-6 py-3.5 gap-2 rounded-2xl min-h-[52px]"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>पारदर्शकता अहवाल</span>
                </Button>
              </Link>
            </div>

            {/* Quick Feature Highlights Checklist */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left w-full pt-5 border-t border-[#E5E1D8]/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#292118]">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>अ‍ॅप इन्स्टॉलेशन नाही</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#292118]">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ऑफलाइन संकलन मोड</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#292118]">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>झिरो कॅश तफावत</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Digital Receipt Mockup */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E1D8] shadow-[0_12px_40px_-8px_rgba(41,33,24,0.12)] overflow-hidden relative transition-all duration-300 hover:shadow-[0_20px_50px_-8px_rgba(41,33,24,0.18)]">
              {/* Top Banner Accent with Royal Maroon Cultural Motif */}
              <div className="bg-gradient-to-br from-[#7C2D12] to-[#5C220E] px-5 py-4 text-white text-center relative border-b-2 border-[#FACC15]">
                <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-[#FACC15] text-[#FACC15] font-black text-xl flex items-center justify-center mx-auto mb-1.5 shadow-md">
                  🚩
                </div>
                <h3 className="font-extrabold text-base tracking-tight leading-snug">
                  श्री शिवनेरी मित्र मंडळ
                </h3>
                <p className="text-[#FACC15] text-[11px] font-bold tracking-widest uppercase mt-0.5">
                  ॥ श्री गणेशाय नमः ॥
                </p>
                <div className="absolute top-3 right-3 bg-emerald-500/20 text-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>प्रमाणित पावती</span>
                </div>
              </div>

              {/* Card Receipt Details */}
              <div className="p-5 space-y-3 bg-[#FCFBF9]">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-[#E5E1D8]/60">
                  <span className="text-[#6B6459] font-medium">पावती क्र. (Receipt No)</span>
                  <span className="font-mono font-bold text-[#7C2D12] bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200/70 text-xs">
                    SSMM-2026-001
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pb-2 border-b border-[#E5E1D8]/60">
                  <span className="text-[#6B6459] font-medium">देणगीदार (Donor)</span>
                  <span className="font-bold text-[#292118]">आनंद जोशी (A-204)</span>
                </div>

                <div className="flex justify-between items-center text-xs pb-2 border-b border-[#E5E1D8]/60">
                  <span className="text-[#6B6459] font-medium">पेमेंट प्रकार (Mode)</span>
                  <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 text-[11px]">
                    रोख (Cash)
                  </span>
                </div>

                {/* Amount Box */}
                <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FFF7ED] border border-[#FDBA74]/80 rounded-2xl p-3.5 text-center shadow-2xs">
                  <div className="text-[10px] font-bold text-[#C2410C] uppercase tracking-wider">
                    स्वीकारलेली देणगी रक्कम
                  </div>
                  <div className="text-3xl font-black text-[#7C2D12] mt-0.5">
                    ₹५०१<span className="text-lg font-bold text-[#C2410C]">/-</span>
                  </div>
                  <div className="text-[11px] text-[#9A3412] font-medium mt-0.5">
                    पाचशे एक रुपये फक्त
                  </div>
                </div>

                {/* QR & Verification */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-13 h-13 rounded-xl border border-[#E5E1D8] bg-white p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                    <QrCode className="w-8 h-8 text-[#292118]" />
                  </div>
                  <p className="text-[11px] text-[#6B6459] leading-tight">
                    ही पावती १००% डिजिटल प्रमाणित आहे. खालील बटणाने व्हॉट्सॲप वर शेअर करता येते.
                  </p>
                </div>
              </div>

              {/* WhatsApp Share Action Button */}
              <div className="px-5 pb-5 bg-[#FCFBF9]">
                <Link href="/login" className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="bg-emerald-50 text-emerald-800 border-emerald-200/80 font-bold gap-2 hover:bg-emerald-100 text-xs py-2.5 rounded-xl cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-emerald-600" />
                    <span>व्हॉट्सॲप पावती नमुना पहा</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition Cards Grid */}
        <div className="mt-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C] bg-orange-50 px-3 py-1 rounded-full border border-orange-200/60 inline-block mb-3">
              कायमस्वरूपी विश्वास व पारदर्शकता
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#292118] tracking-tight">
              कागदी पावत्या सोडण्याची ३ मुख्य कारणे
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6459] font-normal mt-2">
              उत्सव व्यवस्थापनात पारदर्शकता, अचूकता आणि झिरो-तफावत आणणारी सुरक्षित प्रणाली.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5E1D8]/80 shadow-[0_4px_20px_-4px_rgba(41,33,24,0.05)] hover:shadow-[0_10px_30px_-4px_rgba(41,33,24,0.08)] hover:border-[#D6D0C4] transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#C2410C] border border-orange-200/60 flex items-center justify-center mb-4 group-hover:bg-[#7C2D12] group-hover:text-white group-hover:border-[#7C2D12] transition-colors shadow-2xs">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-[#292118]">१० सेकंदांत डिजिटल पावती</h3>
              <p className="text-xs text-[#6B6459] mt-2 leading-relaxed font-normal">
                कोणतेही ॲप डाऊनलोड न करता थेट मोबाईल ब्राऊझरवरून ऑफलाइन किंवा ऑनलाइन तात्काळ पावती फाडा व व्हॉट्सॲप वर पाठवा.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5E1D8]/80 shadow-[0_4px_20px_-4px_rgba(41,33,24,0.05)] hover:shadow-[0_10px_30px_-4px_rgba(41,33,24,0.08)] hover:border-[#D6D0C4] transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center mb-4 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-emerald-700 transition-colors shadow-2xs">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-[#292118]">रोख हिशोब पडताळणी</h3>
              <p className="text-xs text-[#6B6459] mt-2 leading-relaxed font-normal">
                प्रत्येक कार्यकर्त्याकडील जमा रोख रक्कम व पावत्यांचा खजिनदारांसोबत एका क्लिकवर अचूक ताळमेळ व पडताळणी.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-3xl border border-[#E5E1D8]/80 shadow-[0_4px_20px_-4px_rgba(41,33,24,0.05)] hover:shadow-[0_10px_30px_-4px_rgba(41,33,24,0.08)] hover:border-[#D6D0C4] transition-all duration-200 group">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-800 border border-sky-200/60 flex items-center justify-center mb-4 group-hover:bg-sky-700 group-hover:text-white group-hover:border-sky-700 transition-colors shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-lg text-[#292118]">सार्वजनिक पारदर्शकता</h3>
              <p className="text-xs text-[#6B6459] mt-2 leading-relaxed font-normal">
                देणगीदारांसाठी आणि सभासदांसाठी मंडळाच्या जमा व खर्चाचा थेट आणि पारदर्शक सार्वजनिक अहवाल.
              </p>
            </div>
          </div>
        </div>

        {/* Mandal Roles Section */}
        <div className="mt-20 bg-gradient-to-br from-[#2E1810] via-[#1F120C] to-[#2E1810] text-white p-8 sm:p-10 rounded-3xl shadow-xl text-left relative overflow-hidden border border-orange-950/40">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-300 bg-orange-500/10 border border-orange-400/20 px-3 py-1 rounded-full mb-3">
                <Users className="w-3.5 h-3.5" />
                <span>मंडळ व्यवस्थापन व भूमिका</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                प्रत्येक भूमिकेसाठी स्वतंत्र व सुरक्षित व्यवस्था
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed font-normal">
                अध्यक्ष, खजिनदार आणि कार्यकर्ते – प्रत्येकासाठी समर्पित डॅशबोर्ड, अधिकार व्यवस्थापन व सुरक्षित कारभार.
              </p>

              {/* Role Cards */}
              <div className="grid grid-cols-3 gap-2.5 mt-6">
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center backdrop-blur-xs">
                  <div className="text-base font-extrabold text-white">कार्यकर्ता</div>
                  <div className="text-[10px] text-orange-300 font-medium mt-0.5">Volunteer</div>
                </div>

                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center backdrop-blur-xs">
                  <div className="text-base font-extrabold text-white">खजिनदार</div>
                  <div className="text-[10px] text-emerald-300 font-medium mt-0.5">Treasurer</div>
                </div>

                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center backdrop-blur-xs">
                  <div className="text-base font-extrabold text-white">अध्यक्ष</div>
                  <div className="text-[10px] text-amber-300 font-medium mt-0.5">Admin</div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-auto shrink-0">
              <Link href="/login" className="block w-full">
                <Button
                  variant="primary"
                  size="lg"
                  className="font-bold text-base px-8 py-3.5 rounded-2xl w-full sm:w-auto cursor-pointer"
                >
                  <span>मंडळ लॉगिन करा</span>
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-[#6B6459] border-t border-[#E5E1D8] bg-white relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#C2410C] to-[#F97316] flex items-center justify-center text-white text-xs font-bold shadow-xs">
              🚩
            </div>
            <span className="font-extrabold text-base text-[#292118]">डिजिटल वर्गणी</span>
          </div>

          <p>© 2024 Digital Vargani. गणेशोत्सव व सार्वजनिक मंडळांसाठी समर्पित व्यवस्थापन प्रणाली.</p>

          <Link href="/login" className="text-xs font-bold text-[#C2410C] hover:underline flex items-center gap-1">
            <span>मंडळ लॉगिन</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
