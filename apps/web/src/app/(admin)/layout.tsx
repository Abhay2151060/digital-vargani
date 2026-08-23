'use client';

import React from 'react';
import { AuthGuard } from '../../components/AuthGuard';
import { Role } from '@vargani/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.ADMIN, Role.TREASURER]}>
      {children}
    </AuthGuard>
  );
}
