'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'student' | 'tutor';
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in -> send to login
        router.replace('/login');
      } else if (allowedRole && user.role !== allowedRole) {
        // Logged in with wrong role -> redirect to their own dashboard
        if (user.role === 'student') {
          router.replace('/student/dashboard');
        } else if (user.role === 'tutor') {
          router.replace('/tutor/dashboard');
        }
      }
    }
  }, [user, isLoading, allowedRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple mb-3" />
        <p className="text-sm font-medium text-slate-600">Verifying academic session...</p>
      </div>
    );
  }

  if (!user || (allowedRole && user.role !== allowedRole)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
