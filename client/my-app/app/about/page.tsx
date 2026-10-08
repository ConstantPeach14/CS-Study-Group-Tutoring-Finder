import React from 'react';
import Link from 'next/link';
import { Target, Users, GraduationCap, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col flex-1 py-12 sm:py-16 bg-[#e8edf2] text-[#0f172a]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9c4f65]">
            About the Platform
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight">
            Empowering University Students Through Collaborative Learning
          </h1>
          <p className="mt-4 text-base text-[#475569] leading-relaxed">
            The Study Group &amp; Tutoring Finder addresses a common university challenge: finding
            classmates to review material with and dependable peer tutoring can be daunting.
          </p>
        </div>

        {/* Mission & Problem Card */}
        <div className="bg-[#f1f4f8] rounded-2xl p-8 border border-[#cbd5e1] shadow-md mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fce7ec] border border-[#e89aae] text-[#9c4f65] text-xs font-semibold mb-4">
                <Target className="w-3.5 h-3.5" /> Our Mission
              </div>
              <h2 className="text-2xl font-bold text-[#0f172a] mb-3">
                Building Academic Communities that Foster Success
              </h2>
              <p className="text-sm text-[#334155] leading-relaxed mb-4">
                Every student deserves an academic support network. We provide a centralized, secure platform
                where students can find classmates and schedule productive study sessions.
              </p>
              <p className="text-sm text-[#475569] leading-relaxed">
                Simultaneously, we empower capable student tutors to mentor their peers, reinforcing their own mastery
                while helping fellow students conquer difficult concepts.
              </p>
            </div>
            <div className="bg-[#dce3ec] rounded-xl p-6 border border-[#cbd5e1] space-y-4">
              <h3 className="font-semibold text-[#1e293b] text-sm border-b border-[#cbd5e1] pb-2">
                Core Platform Principles
              </h3>
              <div className="flex items-start gap-3 text-xs text-[#334155]">
                <CheckCircle2 className="w-4 h-4 text-[#9c4f65] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#0f172a]">Collaborative Learning:</strong> Students connect with peers to share knowledge and study together.
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs text-[#334155]">
                <CheckCircle2 className="w-4 h-4 text-[#9c4f65] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#0f172a]">Peer Mentorship:</strong> Tutors are students who have already completed the coursework with excellence.
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs text-[#334155]">
                <CheckCircle2 className="w-4 h-4 text-[#9c4f65] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#0f172a]">Accessible &amp; Free Collaboration:</strong> Group study remains accessible to every registered student.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* For Students */}
          <div className="bg-[#f1f4f8] rounded-2xl p-6 border border-[#cbd5e1] shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#fce7ec] border border-[#e89aae] flex items-center justify-center text-[#9c4f65] mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0f172a] mb-2">For Students</h3>
            <ul className="space-y-2 text-sm text-[#334155]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d88299]"></span>
                Connect with classmates and build a supportive academic community.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d88299]"></span>
                Form structured study teams for weekly reviews and exam prep.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d88299]"></span>
                Request guidance from qualified peer tutors when stuck.
              </li>
            </ul>
          </div>

          {/* For Tutors */}
          <div className="bg-[#f1f4f8] rounded-2xl p-6 border border-[#cbd5e1] shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#fce7ec] border border-[#e89aae] flex items-center justify-center text-[#9c4f65] mb-4">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0f172a] mb-2">For Tutors</h3>
            <ul className="space-y-2 text-sm text-[#334155]">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d88299]"></span>
                Offer structured tutoring in subjects you have excelled in.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d88299]"></span>
                Manage your tutor dashboard and profile information.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d88299]"></span>
                Build teaching leadership and academic communication experience.
              </li>
            </ul>
          </div>
        </div>

        {/* Action Banner */}
        <div className="bg-[#fce7ec] rounded-2xl p-8 border border-[#e89aae] text-center shadow-md">
          <h3 className="text-xl font-bold text-[#0f172a] mb-2">
            Get started with Study Group &amp; Tutoring Finder
          </h3>
          <p className="text-sm text-[#475569] mb-6 max-w-lg mx-auto">
            Create your account now to access role-specific dashboards and start building your study network.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#d88299] hover:bg-[#c46982] shadow-xs transition-colors"
            >
              Register Now
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#1e293b] bg-[#dce3ec] border border-[#cbd5e1] hover:bg-[#cbd5e1] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
