'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Mandal, Role, Language } from '@vargani/types';
import { apiRequest } from '../lib/api-client';

interface AuthState {
  user: User | null;
  activeMandal: Mandal | null;
  role: Role | null;
  memberships: any[];
  token: string | null;
  language: Language;
  isLoading: boolean;
  login: (phone: string, otp: string, fullName?: string) => Promise<void>;
  logout: () => void;
  switchMandal: (mandalId: string) => Promise<void>;
  updateActiveMandal: (mandal: Mandal) => void;
  setLanguage: (lang: Language) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeMandal, setActiveMandal] = useState<Mandal | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [language, setLanguageState] = useState<Language>(Language.MARATHI);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem('vargani_token');
      const savedUser = localStorage.getItem('vargani_user');
      const savedMandal = localStorage.getItem('vargani_mandal');
      const savedRole = localStorage.getItem('vargani_role') as Role | null;
      const savedMemberships = localStorage.getItem('vargani_memberships');
      const savedLang = localStorage.getItem('vargani_lang') as Language | null;

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        if (savedMandal) setActiveMandal(JSON.parse(savedMandal));
        if (savedRole) setRole(savedRole);
        if (savedMemberships) setMemberships(JSON.parse(savedMemberships));
        if (savedLang) setLanguageState(savedLang);

        // Single Source of Truth: Sync fresh active mandal profile from DB
        try {
          const freshMandal = await apiRequest<Mandal>('/mandals/current');
          if (freshMandal && freshMandal.id) {
            setActiveMandal((prev) => ({ ...prev, ...freshMandal }));
            localStorage.setItem('vargani_mandal', JSON.stringify(freshMandal));
          }
        } catch (syncErr) {
          console.warn('Failed to re-sync active mandal settings from server:', syncErr);
        }
      }
    } catch (e) {
      console.error('Failed to parse saved auth', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (phone: string, otp: string, fullName?: string) => {
    const res = await apiRequest<any>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, full_name: fullName }),
    });

    const { user: userData, activeMandal: mandalData, memberships: mems, accessToken } = res;

    localStorage.setItem('vargani_token', accessToken);
    localStorage.setItem('vargani_user', JSON.stringify(userData));
    if (mandalData) {
      localStorage.setItem('vargani_mandal', JSON.stringify(mandalData));
      localStorage.setItem('vargani_role', mandalData.role);
    }
    localStorage.setItem('vargani_memberships', JSON.stringify(mems));

    setToken(accessToken);
    setUser(userData);
    setActiveMandal(mandalData);
    setRole(mandalData?.role || null);
    setMemberships(mems);
  };

  const logout = () => {
    localStorage.removeItem('vargani_token');
    localStorage.removeItem('vargani_user');
    localStorage.removeItem('vargani_mandal');
    localStorage.removeItem('vargani_role');
    localStorage.removeItem('vargani_memberships');
    setToken(null);
    setUser(null);
    setActiveMandal(null);
    setRole(null);
    setMemberships([]);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const switchMandal = async (mandalId: string) => {
    const res = await apiRequest<any>('/auth/switch-mandal', {
      method: 'POST',
      body: JSON.stringify({ mandal_id: mandalId }),
    });

    const { accessToken, activeMandal: newMandal } = res;
    localStorage.setItem('vargani_token', accessToken);
    localStorage.setItem('vargani_mandal', JSON.stringify(newMandal));
    localStorage.setItem('vargani_role', newMandal.role);

    setToken(accessToken);
    setActiveMandal(newMandal);
    setRole(newMandal.role);
  };

  const updateActiveMandal = (newMandal: Mandal) => {
    localStorage.setItem('vargani_mandal', JSON.stringify(newMandal));
    setActiveMandal(newMandal);
    setMemberships((prev) =>
      prev.map((m) => (m.id === newMandal.id ? { ...m, ...newMandal } : m))
    );
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('vargani_lang', lang);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeMandal,
        role,
        memberships,
        token,
        language,
        isLoading,
        login,
        logout,
        switchMandal,
        updateActiveMandal,
        setLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
