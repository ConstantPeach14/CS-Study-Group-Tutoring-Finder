'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { BookOpen, Users, GraduationCap, User, ArrowRight, Clock, Calendar } from 'lucide-react';

export default function StudentDashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRole="student">
      <div className="flex-1 py-8 sm:py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Welcome Banner */}
          <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-purple text-xs font-semibold mb-2">
                <Users className="w-3.5 h-3.5" /> Student Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Welcome back, {user?.name} {user?.surname}!
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Logged in as <span className="font-semibold text-slate-800">{user?.email}</span>
              </p>
            </div>

            <Link
              href="/student/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-purple hover:bg-purple-hover shadow-xs transition-colors"
            >
              <User className="w-4 h-4" />
              View Student Profile
            </Link>
          </div>

          {/* Dashboard Metric Placeholders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  My Study Groups
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-purple flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">0</div>
              <p className="text-xs text-slate-500 mt-2">Active module study groups</p>
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-light-green font-medium">
                Find and join study groups
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tutoring Sessions
                </span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-light-green flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">0</div>
              <p className="text-xs text-slate-500 mt-2">Scheduled tutoring appointments</p>
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-light-green font-medium">
                Connect with verified tutors
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Saved Modules
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-purple flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">0</div>
              <p className="text-xs text-slate-500 mt-2">Enrolled university courses</p>
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-light-green font-medium">
                Track your university modules
              </div>
            </div>
          </div>

          {/* Quick Actions & Placeholder Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple" />
                Upcoming Study Activities
              </h2>
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">No scheduled sessions yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Once study groups and tutoring sessions are activated, your schedule will appear here.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-light-green" />
                Student Profile Quick View
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-semibold text-slate-900">{user?.name} {user?.surname}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold text-slate-900">{user?.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Role Status</span>
                  <span className="font-semibold text-purple capitalize">{user?.role}</span>
                </div>
                <div className="pt-2">
                  <Link
                    href="/student/profile"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-light-green hover:underline"
                  >
                    Manage full profile details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
