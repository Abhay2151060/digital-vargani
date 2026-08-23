'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Language, Role } from '@vargani/types';
import { getT } from '../lib/i18n';
import { LogOut, Globe, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, activeMandal, role, memberships, language, setLanguage, logout, switchMandal } = useAuth();
  const t = getT(language);

  const getRoleLabel = (r: Role | null) => {
    switch (r) {
      case Role.ADMIN:
        return 'Admin';
      case Role.TREASURER:
        return 'खजिनदार (Treasurer)';
      case Role.VOLUNTEER:
        return 'कार्यकर्ता (Volunteer)';
      default:
        return '';
    }
  };

  const getNavItems = () => {
    if (role === Role.ADMIN) {
      return [
        { label: 'डॅशबोर्ड', href: '/dashboard' },
        { label: 'खर्च', href: '/expenses' },
        { label: 'सदस्य', href: '/members' },
        { label: 'सेटिंग्ज', href: '/settings' },
      ];
    }
    if (role === Role.TREASURER) {
      return [
        { label: 'डॅशबोर्ड', href: '/dashboard' },
        { label: 'जमा जुळवणी', href: '/reconciliation' },
        { label: 'अहवाल', href: '/reports' },
      ];
    }
    if (role === Role.VOLUNTEER) {
      return [
        { label: 'पावती फाडा', href: '/collect' },
        { label: 'माझे जमा', href: '/totals' },
        { label: 'इतिहास', href: '/history' },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E1D8] shadow-xs">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Mandal Brand Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C2410C] to-[#F97316] flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20 shrink-0 overflow-hidden">
            {activeMandal?.logo_url ? (
              <img
                src={activeMandal.logo_url}
                alt={activeMandal.name || 'Logo'}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-200" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-[#292118] truncate leading-tight">
              {activeMandal?.name || t.app_title}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6B6459]">
              {role && (
                <span className="font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
                  {getRoleLabel(role)}
                </span>
              )}
              {activeMandal?.city && (
                <span className="hidden sm:inline-block truncate">
                  • {activeMandal.city} {activeMandal.area ? `(${activeMandal.area})` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Role Navigation Bar for Medium & Desktop Screens */}
        {navItems.length > 0 && (
          <nav className="hidden md:flex items-center gap-1 bg-[#F3F1EC] p-1 rounded-xl border border-[#E5E1D8]">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#6B6459] hover:text-[#F97316] hover:bg-white transition"
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Multi-mandal switcher if applicable */}
          {memberships.length > 1 && (
            <select
              value={activeMandal?.id || ''}
              onChange={(e) => switchMandal(e.target.value)}
              className="text-xs bg-[#F3F1EC] border border-[#E5E1D8] rounded-lg px-2 py-1.5 font-medium text-[#292118] focus:outline-none"
            >
              {memberships.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}

          {/* Language Selector */}
          <div className="flex items-center bg-[#F3F1EC] rounded-xl p-1 border border-[#E5E1D8]">
            <Globe className="w-3.5 h-3.5 text-[#6B6459] ml-1 mr-0.5" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              aria-label="Select language"
              className="bg-transparent text-xs font-semibold text-[#292118] px-1 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value={Language.MARATHI}>मराठी</option>
              <option value={Language.ENGLISH}>English</option>
            </select>
          </div>

          {/* Logout Button */}
          {user && (
            <button
              onClick={logout}
              title={t.logout}
              className="p-2 rounded-xl text-[#6B6459] hover:bg-red-50 hover:text-red-600 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
