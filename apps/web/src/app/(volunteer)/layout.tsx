'use client';

import React from 'react';
import { AuthGuard } from '../../components/AuthGuard';
import { Role } from '@vargani/types';

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={[Role.VOLUNTEER, Role.TREASURER, Role.ADMIN]}>
      {children}
    </AuthGuard>
  );
}
