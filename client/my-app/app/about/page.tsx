import React from 'react';
import Link from 'next/link';
import { Target, Users, GraduationCap, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col flex-1 py-12 sm:py-16 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-light-green">
            About the Platform
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Empowering University Students Through Collaborative Learning
          </h1>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            The Study Group & Tutoring Finder addresses a common university challenge: in large lecture halls
            and introductory modules, finding peers to review material with or finding dependable tutoring help can be daunting.
          </p>
        </div>

        {/* Mission & Problem Card */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-xs mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-purple text-xs font-semibold mb-4">
                <Target className="w-3.5 h-3.5" /> Our Mission
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Building Academic Communities that Foster Success
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Every student deserves an academic support network. We provide a centralized, secure platform
                where students can easily discover peers in identical modules and schedule productive study sessions.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Simultaneously, we empower capable student tutors to mentor their peers, reinforcing their own mastery
                while helping fellow students conquer difficult concepts.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-200 pb-2">
                Core Platform Principles
              </h3>
              <div className="flex items-start gap-3 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-light-green shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Direct Module Relevance:</strong> Study groups and tutoring are organized strictly by course codes and university modules.
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-light-green shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Peer Mentorship:</strong> Tutors are students who have already completed the coursework with excellence.
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-light-green shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800">Accessible & Free Collaboration:</strong> Group study remains accessible to every registered student.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* For Students */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-purple mb-4 border border-slate-200">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">For Students</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple"></span>
                Connect with classmates in your current module enrolments.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple"></span>
                Form structured study teams for weekly reviews and exam prep.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple"></span>
                Request guidance from qualified peer tutors when stuck.
              </li>
            </ul>
          </div>

          {/* For Tutors */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-light-green mb-4 border border-sky-100">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">For Tutors</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-light-green"></span>
                Offer structured tutoring in modules you have excelled in.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-light-green"></span>
                Manage your tutor dashboard and profile information.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-light-green"></span>
                Build teaching leadership and academic communication experience.
              </li>
            </ul>
          </div>
        </div>

        {/* Action Banner */}
        <div className="bg-white rounded-xl p-8 border border-slate-200 text-center shadow-xs">
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Get started with Study Group & Tutoring Finder
          </h3>
          <p className="text-sm text-slate-600 mb-6 max-w-lg mx-auto">
            Create your account now to access role-specific dashboards and start building your study network.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-purple hover:bg-purple-hover shadow-xs transition-colors"
            >
              Register Now
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold text-light-green bg-slate-50 border border-slate-200 hover:bg-sky-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
