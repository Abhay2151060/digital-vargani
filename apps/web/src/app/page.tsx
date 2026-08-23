'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Role } from '@vargani/types';
import { Sparkles, Shield, Smartphone, HeartHandshake, ArrowRight } from 'lucide-react';
import { Button } from '@vargani/ui';
import Link from 'next/link';

export default function HomePage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F97316]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF9F6]">
      {/* Top Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E5E1D8] bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C2410C] to-[#F97316] flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20">
            🚩
          </div>
          <span className="font-extrabold text-lg text-[#292118] tracking-tight">डिजिटल वर्गणी</span>
        </div>
        <Link href="/login">
          <Button variant="primary" size="sm" className="font-semibold">
            मंडळ लॉगिन
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 py-12 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-800 border border-orange-200 px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <span>गणेशोत्सव, नवरात्र व सार्वजनिक मंडळांसाठी खास व्यासपीठ</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#292118] tracking-tight leading-tight max-w-2xl">
          कागदी पावत्या बंद करा, <span className="text-[#F97316]">डिजिटल वर्गणी</span> सुरू करा!
        </h1>

        <p className="mt-4 text-base sm:text-lg text-[#6B6459] max-w-xl">
          १० सेकंदांत डिजिटल पावती, थेट व्हॉट्सॲप वर शेअरिंग, रोख हिशोब पडताळणी आणि १००% सार्वजनिक पारदर्शकता.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" fullWidth className="font-bold gap-2">
              <span>वर्गणी नोंदणी सुरू करा</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/mandal/shivneri-mitra-mandal/transparency" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" fullWidth className="font-semibold">
              डेमो पारदर्शकता पोर्टल
            </Button>
          </Link>
        </div>

        {/* Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 text-left w-full">
          <div className="bg-white p-5 rounded-2xl border border-[#E5E1D8] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
              <Smartphone className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-[#292118]">१० सेकंदांत पावती</h2>
            <p className="text-xs text-[#6B6459] mt-1">
              अ‍ॅप इन्स्टॉल न करता कोणत्याही मोबाईल ब्राऊझरवरून ऑफलाइन किंवा ऑनलाइन तात्काळ पावती.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E1D8] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-[#292118]">रोख हिशोब पडताळणी</h2>
            <p className="text-xs text-[#6B6459] mt-1">
              प्रत्येक कार्यकर्त्याकडील रोख रक्कमेचा आणि जमा पावतीचा खजिनदारांसोबत अचूक ताळमेळ.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E1D8] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base text-[#292118]">सार्वजनिक पारदर्शकता</h2>
            <p className="text-xs text-[#6B6459] mt-1">
              भक्तांसाठी आणि सभासदांसाठी मंडळाच्या जमा व खर्चाचा थेट आणि पारदर्शक हिशोब.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-[#6B6459] border-t border-[#E5E1D8] bg-white">
        <p>© 2024 Digital Vargani. उत्सव आणि मंडळांसाठी समर्पित व्यवस्थापन प्रणाली.</p>
      </footer>
    </div>
  );
}
