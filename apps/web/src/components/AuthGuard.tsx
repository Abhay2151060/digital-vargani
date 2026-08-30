'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Role } from '@vargani/types';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user, role, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // If user is not authenticated, redirect to login page
      if (!user || !token) {
        router.replace('/login');
        return;
      }

      // If specific roles are required, verify user's role
      if (allowedRoles && allowedRoles.length > 0 && role) {
        if (!allowedRoles.includes(role)) {
          if (role === Role.ADMIN || role === Role.TREASURER) {
            router.replace('/dashboard');
          } else if (role === Role.VOLUNTEER) {
            router.replace('/history');
          } else {
            router.replace('/login');
          }
        }
      }
    }
  }, [user, role, token, isLoading, allowedRoles, router]);

  // Show loading indicator while resolving auth status or redirecting unauthenticated / unauthorized users
  if (isLoading || !user || !token || (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F97316]"></div>
      </div>
    );
  }

  return <>{children}</>;
};
