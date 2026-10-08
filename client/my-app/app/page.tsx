'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Users, GraduationCap, ArrowRight, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const dashboardPath = user?.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard';

  return (
    <div className="flex flex-col flex-1 bg-[#e8edf2] text-[#0f172a]">
      {/* Hero Section */}
      <section className="border-b border-[#cbd5e1] py-16 sm:py-24 bg-gradient-to-b from-[#e2e8f0] via-[#ebf0f5] to-[#e8edf2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fce7ec] border border-[#e89aae] text-xs font-bold text-[#9c4f65] mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#9c4f65]" />
            University Academic Collaboration Platform
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#0f172a] tracking-tight leading-tight max-w-4xl mx-auto">
            Find Your <span className="text-[#9c4f65]">Study Group</span> & Connect with Peer <span className="text-[#9c4f65]">Tutors</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-[#334155] max-w-2xl mx-auto leading-relaxed">
            Never study alone again. Connect with university classmates, form structured study
            teams, and get peer tutoring support.
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!user ? (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] border border-[#d47b93] shadow-xs transition-all transform active:scale-95"
                >
                  Create Student or Tutor Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/tutors"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-[#1e293b] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] shadow-xs transition-all"
                >
                  <GraduationCap className="w-4 h-4 text-[#9c4f65]" />
                  Find a Peer Tutor
                </Link>
                <Link
                  href="/study-groups"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-[#1e293b] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] shadow-xs transition-all"
                >
                  <Users className="w-4 h-4 text-[#9c4f65]" />
                  Explore Study Groups
                </Link>
              </>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href={dashboardPath}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] border border-[#d47b93] shadow-xs transition-all"
                >
                  Go to Your {user.role === 'tutor' ? 'Tutor' : 'Student'} Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/tutors"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-[#1e293b] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-all"
                >
                  <GraduationCap className="w-4 h-4 text-[#9c4f65]" />
                  Find Tutors
                </Link>
              </div>
            )}
          </div>

          {/* Value Highlights */}
          <div className="mt-12 pt-8 border-t border-[#cbd5e1] max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="flex items-center gap-3 bg-[#f1f4f8] p-3.5 rounded-xl border border-[#cbd5e1]">
              <CheckCircle2 className="w-5 h-5 text-[#9c4f65] shrink-0" />
              <span className="text-xs font-bold text-[#1e293b]">Peer Study Community</span>
            </div>
            <div className="flex items-center gap-3 bg-[#f1f4f8] p-3.5 rounded-xl border border-[#cbd5e1]">
              <CheckCircle2 className="w-5 h-5 text-[#9c4f65] shrink-0" />
              <span className="text-xs font-bold text-[#1e293b]">Verified Peer Tutors</span>
            </div>
            <div className="flex items-center gap-3 bg-[#f1f4f8] p-3.5 rounded-xl border border-[#cbd5e1]">
              <CheckCircle2 className="w-5 h-5 text-[#9c4f65] shrink-0" />
              <span className="text-xs font-bold text-[#1e293b]">Small Group Study Jams</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Cards */}
      <section className="py-16 sm:py-20 bg-[#e8edf2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
              Designed Specifically for University Success
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#475569]">
              Overcoming the isolation of massive lecture halls through community and shared learning goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Study Groups */}
            <div className="bg-[#f1f4f8] rounded-2xl p-6 border border-[#cbd5e1] hover:border-[#e89aae] transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-[#fce7ec] flex items-center justify-center text-[#9c4f65] mb-5 border border-[#e89aae]">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-2">Classmate Study Groups</h3>
              <p className="text-sm text-[#475569] leading-relaxed mb-4">
                Connect with classmates to tackle problem sets, discuss complex concepts, and prepare for exams together.
              </p>
              <Link href="/study-groups" className="text-xs font-bold text-[#9c4f65] hover:underline inline-flex items-center gap-1">
                Explore Groups <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2: Peer Tutoring */}
            <div className="bg-[#f1f4f8] rounded-2xl p-6 border border-[#cbd5e1] hover:border-[#e89aae] transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-[#fce7ec] flex items-center justify-center text-[#9c4f65] mb-5 border border-[#e89aae]">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-2">Verified Peer Tutors</h3>
              <p className="text-sm text-[#475569] leading-relaxed mb-4">
                Get direct academic guidance from experienced students who can help you master challenging subjects.
              </p>
              <Link href="/tutors" className="text-xs font-bold text-[#9c4f65] hover:underline inline-flex items-center gap-1">
                Find Tutors <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3: Academic Role System */}
            <div className="bg-[#f1f4f8] rounded-2xl p-6 border border-[#cbd5e1] hover:border-[#e89aae] transition-all shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-[#fce7ec] flex items-center justify-center text-[#9c4f65] mb-5 border border-[#e89aae]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-2">Role-Based Profiles</h3>
              <p className="text-sm text-[#475569] leading-relaxed mb-4">
                Dedicated student and tutor portals with secure authentication, profile management, and seamless session booking.
              </p>
              <Link href="/register" className="text-xs font-bold text-[#9c4f65] hover:underline inline-flex items-center gap-1">
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
