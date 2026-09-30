'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { User, Mail, Calendar, Shield, ArrowLeft, LayoutDashboard, CheckCircle2 } from 'lucide-react';

export default function StudentProfilePage() {
  const { user } = useAuth();

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <ProtectedRoute allowedRole="student">
      <div className="flex-1 py-10 sm:py-14 bg-[#e8edf2] text-[#0f172a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Back Navigation */}
          <div>
            <Link
              href="/student/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#475569] hover:text-[#d88299] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Student Dashboard
            </Link>
          </div>

          {/* Profile Card */}
          <div className="bg-[#f1f4f8] rounded-2xl shadow-xl border border-[#cbd5e1] overflow-hidden">
            {/* Header banner */}
            <div className="bg-[#dce3ec] border-b border-[#cbd5e1] p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="w-20 h-20 rounded-2xl bg-[#fce7ec] text-[#d88299] border-2 border-[#9c4f65]/60 flex items-center justify-center font-extrabold text-2xl shadow-md">
                  {user?.name?.[0]?.toUpperCase()}{user?.surname?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#fce7ec] border border-[#9c4f65]/40 text-[#d88299] text-xs font-semibold mb-2">
                    <Shield className="w-3.5 h-3.5" />
                    Verified Student Account
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {user?.name} {user?.surname}
                  </h1>
                  <p className="text-sm text-[#475569] mt-0.5">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Profile Information List */}
            <div className="p-6 sm:p-8 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#334155] border-b border-[#cbd5e1] pb-2">
                Account Credentials & Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#e8edf2] border border-[#cbd5e1]">
                  <User className="w-5 h-5 text-[#d88299] shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-medium text-[#475569]">First Name</span>
                    <span className="text-sm font-semibold text-white">{user?.name}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#e8edf2] border border-[#cbd5e1]">
                  <User className="w-5 h-5 text-[#d88299] shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-medium text-[#475569]">Surname</span>
                    <span className="text-sm font-semibold text-white">{user?.surname}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#e8edf2] border border-[#cbd5e1]">
                  <Mail className="w-5 h-5 text-[#d88299] shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-medium text-[#475569]">Email Address</span>
                    <span className="text-sm font-semibold text-white">{user?.email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#e8edf2] border border-[#cbd5e1]">
                  <Shield className="w-5 h-5 text-[#d88299] shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-medium text-[#475569]">Assigned Role</span>
                    <span className="text-sm font-semibold text-[#d88299] capitalize">{user?.role}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#e8edf2] border border-[#cbd5e1] sm:col-span-2">
                  <Calendar className="w-5 h-5 text-[#d88299] shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-medium text-[#475569]">Member Since</span>
                    <span className="text-sm font-semibold text-white">{formattedDate}</span>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-[#dce3ec] rounded-xl p-4 border border-[#cbd5e1] flex items-start gap-3 text-xs text-[#334155]">
                <CheckCircle2 className="w-4 h-4 text-[#d88299] shrink-0 mt-0.5" />
                <span>
                  Basic profile data is retrieved directly from the verified database. Enrolled modules, study groups, and peer tutoring sessions can be tracked through your student portal.
                </span>
              </div>
            </div>

            {/* Footer Action */}
            <div className="bg-[#dce3ec] px-6 sm:px-8 py-4 border-t border-[#cbd5e1] flex justify-end">
              <Link
                href="/student/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#d88299] hover:bg-[#c46982] hover:text-white shadow-xs transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
