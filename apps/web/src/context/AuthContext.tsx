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
  mustChangePassword: boolean;
  login: (username: string, password: string) => Promise<{ mustChangePassword: boolean }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  switchMandal: (mandalId: string) => Promise<void>;
  updateActiveMandal: (mandal: Mandal) => void;
  setLanguage: (lang: Language) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const safeSetMandalStorage = (mandal: any) => {
  if (!mandal) return;
  try {
    const sanitized = { ...mandal };
    // Strip large base64 files from localStorage to stay well within 5MB quota
    if (sanitized.ahwal_url && sanitized.ahwal_url.length > 500) {
      delete sanitized.ahwal_url;
    }
    if (sanitized.upi_qr_url && sanitized.upi_qr_url.length > 100000) {
      delete sanitized.upi_qr_url;
    }
    if (sanitized.logo_url && sanitized.logo_url.length > 100000) {
      delete sanitized.logo_url;
    }
    localStorage.setItem('vargani_mandal', JSON.stringify(sanitized));
  } catch (err) {
    console.warn('localStorage quota warning for vargani_mandal:', err);
    try {
      const minimal = {
        id: mandal.id,
        name: mandal.name,
        slug: mandal.slug,
        role: mandal.role,
        receipt_prefix: mandal.receipt_prefix,
        festival_type: mandal.festival_type,
      };
      localStorage.setItem('vargani_mandal', JSON.stringify(minimal));
    } catch {
      // Ignore if localStorage quota is hard blocked
    }
  }
};

const safeSetMembershipsStorage = (mems: any[]) => {
  if (!mems || !Array.isArray(mems)) return;
  try {
    const sanitized = mems.map((m) => {
      const copy = { ...m };
      if (copy.ahwal_url) delete copy.ahwal_url;
      if (copy.upi_qr_url && copy.upi_qr_url.length > 50000) delete copy.upi_qr_url;
      if (copy.logo_url && copy.logo_url.length > 50000) delete copy.logo_url;
      return copy;
    });
    localStorage.setItem('vargani_memberships', JSON.stringify(sanitized));
  } catch (err) {
    console.warn('localStorage quota warning for vargani_memberships:', err);
    try {
      const minimal = mems.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        slug: m.slug,
      }));
      localStorage.setItem('vargani_memberships', JSON.stringify(minimal));
    } catch {
      // Ignore if localStorage is full
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeMandal, setActiveMandal] = useState<Mandal | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [language, setLanguageState] = useState<Language>(Language.MARATHI);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);

  const initAuth = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem('vargani_token');
      const savedUser = localStorage.getItem('vargani_user');
      const savedMandal = localStorage.getItem('vargani_mandal');
      const savedRole = localStorage.getItem('vargani_role') as Role | null;
      const savedMemberships = localStorage.getItem('vargani_memberships');
      const savedLang = localStorage.getItem('vargani_lang') as Language | null;
      if (savedLang) setLanguageState(savedLang);

      if (savedToken && savedUser) {
        setToken(savedToken);
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setMustChangePassword(!!parsedUser?.must_change_password);
        if (savedMandal) setActiveMandal(JSON.parse(savedMandal));
        if (savedRole) setRole(savedRole);
        if (savedMemberships) setMemberships(JSON.parse(savedMemberships));

        // Single Source of Truth: Sync fresh active mandal profile from DB
        try {
          const freshMandal = await apiRequest<Mandal>('/mandals/current');
          if (freshMandal && freshMandal.id) {
            setActiveMandal((prev) => ({ ...prev, ...freshMandal }));
            safeSetMandalStorage(freshMandal);
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

  const login = async (username: string, password: string) => {
    const res = await apiRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: username.trim(), password }),
    });

    const { user: userData, activeMandal: mandalData, memberships: mems, accessToken } = res;

    try {
      localStorage.setItem('vargani_token', accessToken);
      localStorage.setItem('vargani_user', JSON.stringify(userData));
    } catch (err) {
      console.warn('Error storing token/user:', err);
    }

    if (mandalData) {
      safeSetMandalStorage(mandalData);
      try {
        localStorage.setItem('vargani_role', mandalData.role);
      } catch (err) {
        console.warn('Error storing role:', err);
      }
    }

    safeSetMembershipsStorage(mems);

    const requiresPassChange = !!userData?.must_change_password;
    setMustChangePassword(requiresPassChange);
    setToken(accessToken);
    setUser(userData);
    setActiveMandal(mandalData);
    setRole(mandalData?.role || null);
    setMemberships(mems);

    return { mustChangePassword: requiresPassChange };
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    setMustChangePassword(false);
    if (user) {
      const updated = { ...user, must_change_password: false };
      setUser(updated);
      try {
        localStorage.setItem('vargani_user', JSON.stringify(updated));
      } catch (err) {
        console.warn('Error saving updated user:', err);
      }
    }
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
    setMustChangePassword(false);
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
    safeSetMandalStorage(newMandal);
    localStorage.setItem('vargani_role', newMandal.role);

    setToken(accessToken);
    setActiveMandal(newMandal);
    setRole(newMandal.role);
  };

  const updateActiveMandal = (newMandal: Mandal) => {
    safeSetMandalStorage(newMandal);
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
        mustChangePassword,
        login,
        changePassword,
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
