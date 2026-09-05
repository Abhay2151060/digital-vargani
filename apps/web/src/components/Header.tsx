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
    if (language === Language.ENGLISH) {
      switch (r) {
        case Role.ADMIN:
          return 'Admin';
        case Role.TREASURER:
          return 'Treasurer';
        case Role.VOLUNTEER:
          return 'Volunteer';
        default:
          return '';
      }
    } else {
      switch (r) {
        case Role.ADMIN:
          return 'व्यवस्थापक (Admin)';
        case Role.TREASURER:
          return 'खजिनदार (Treasurer)';
        case Role.VOLUNTEER:
          return 'कार्यकर्ता (Volunteer)';
        default:
          return '';
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-[#E5E1D8]/80 shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Mandal Brand Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C2D12] via-[#C2410C] to-[#F97316] flex items-center justify-center text-white font-bold shadow-sm shadow-orange-500/20 shrink-0 overflow-hidden border border-orange-500/20">
            {activeMandal?.logo_url ? (
              <img
                src={activeMandal.logo_url}
                alt={activeMandal.name || 'Logo'}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span className="text-base">🚩</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-[#292118] truncate leading-tight">
              {activeMandal?.name || t.app_title}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-[#6B6459] mt-0.5">
              {role && (
                <span className="font-semibold text-[#7C2D12] bg-orange-50 px-2 py-0.2 rounded-full border border-orange-200/70">
                  {getRoleLabel(role)}
                </span>
              )}
              {activeMandal?.city && (
                <span className="hidden sm:inline-block truncate font-medium">
                  • {activeMandal.city} {activeMandal.area ? `(${activeMandal.area})` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

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
