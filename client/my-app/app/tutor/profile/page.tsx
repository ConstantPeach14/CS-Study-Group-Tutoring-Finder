'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { GraduationCap, Mail, Calendar, Shield, ArrowLeft, LayoutDashboard, CheckCircle2 } from 'lucide-react';

export default function TutorProfilePage() {
  const { user } = useAuth();

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <ProtectedRoute allowedRole="tutor">
      <div className="flex-1 py-10 sm:py-14 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link
              href="/tutor/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-light-green hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tutor Dashboard
            </Link>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-b border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="w-20 h-20 rounded-full bg-purple text-white flex items-center justify-center font-bold text-2xl shadow-xs border-2 border-white">
                  {user?.name?.[0]?.toUpperCase()}{user?.surname?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-50 text-light-green border border-sky-100 text-xs font-semibold mb-2">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Verified Peer Tutor
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    Tutor {user?.name} {user?.surname}
                  </h1>
                  <p className="text-sm text-slate-600 mt-0.5">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Profile Information List */}
            <div className="p-6 sm:p-8 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Tutor Credentials & Account Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <GraduationCap className="w-5 h-5 text-purple shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-medium text-slate-500">First Name</span>
                    <span className="text-sm font-semibold text-slate-900">{user?.name}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <GraduationCap className="w-5 h-5 text-purple shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Surname</span>
                    <span className="text-sm font-semibold text-slate-900">{user?.surname}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <Mail className="w-5 h-5 text-light-green shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Email Address</span>
                    <span className="text-sm font-semibold text-slate-900">{user?.email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <Shield className="w-5 h-5 text-purple shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Assigned Role</span>
                    <span className="text-sm font-semibold text-purple capitalize">{user?.role}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200 sm:col-span-2">
                  <Calendar className="w-5 h-5 text-light-green shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-medium text-slate-500">Member Since</span>
                    <span className="text-sm font-semibold text-slate-900">{formattedDate}</span>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-light-green shrink-0 mt-0.5" />
                <span>
                  Basic profile data is retrieved directly from the verified database. Additional tutor profile setup
                  (including subjects, qualifications, availability schedules, and reviews) can be managed here.
                </span>
              </div>
            </div>

            {/* Footer Action */}
            <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex justify-end">
              <Link
                href="/tutor/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-purple hover:bg-purple-hover shadow-xs transition-colors"
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
