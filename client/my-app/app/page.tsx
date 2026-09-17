'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Users, GraduationCap, BookOpen, ArrowRight, CheckCircle2, Search, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const dashboardPath = user?.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard';

  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-pink mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-pink" />
            University Academic Collaboration Platform
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Find Your <span className="text-purple">Study Group</span> & Connect with Peer <span className="text-light-green">Tutors</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Never study alone again. Connect with university classmates taking the same modules,
            form structured study teams, and get academic tutoring support.
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!user ? (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg text-base font-semibold text-white bg-purple hover:bg-purple-hover shadow-sm transition-all transform active:scale-95"
                >
                  Create Student or Tutor Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/about"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg text-base font-semibold text-light-green bg-white border border-slate-300 hover:bg-sky-50 shadow-2xs transition-all"
                >
                  Learn How It Works
                </Link>
              </>
            ) : (
              <Link
                href={dashboardPath}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-base font-semibold text-white bg-purple hover:bg-purple-hover shadow-sm transition-all"
              >
                Go to Your {user.role === 'tutor' ? 'Tutor' : 'Student'} Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Value Highlights */}
          <div className="mt-12 pt-8 border-t border-slate-200/80 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-light-green shrink-0" />
              <span className="text-xs font-medium text-slate-700">Course & Module Matching</span>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-light-green shrink-0" />
              <span className="text-xs font-medium text-slate-700">Verified Peer Tutors</span>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-light-green shrink-0" />
              <span className="text-xs font-medium text-slate-700">Focused Study Sessions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Cards */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Designed Specifically for University Success
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Overcoming the isolation of massive lecture halls through community and shared learning goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-purple mb-5 border border-slate-200">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Classmate Study Groups</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect with peers registered in your specific modules. Form groups to tackle problem sets, discuss complex concepts, and prepare for exams.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-sky-50 flex items-center justify-center text-light-green mb-5 border border-sky-100">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Peer Tutor Support</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Get one-on-one help from upperclassmen and qualified student tutors who have successfully mastered the curriculum and syllabus.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-purple mb-5 border border-slate-200">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Module-Focused Learning</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Organize your study sessions around university assignments and exam schedules, maximizing academic performance together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Bar */}
      <section className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-purple">
            Ready to enhance your university learning experience?
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Sign up today as a student seeking study partners or as a tutor sharing your expertise.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-purple hover:bg-purple-hover shadow-xs transition-colors"
            >
              Register Now
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-light-green hover:bg-sky-50 border border-slate-300 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
