import React from 'react';
import Link from 'next/link';
import { BookOpen, Mail, Shield, GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#e2e8f0] border-t border-[#cbd5e1] mt-auto text-[#334155]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#d88299] flex items-center justify-center text-[#1e293b] font-bold">
                <BookOpen className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="font-extrabold text-lg text-[#0f172a]">
                Study Group & Tutoring Finder
              </span>
            </div>
            <p className="text-sm text-[#475569] max-w-md">
              Connecting university students with classmates in their modules to form collaborative
              study groups and receive targeted peer tutoring assistance.
            </p>
            <div className="flex items-center gap-4 text-xs text-[#64748b] pt-1">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4 text-[#9c4f65]" /> University Network
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-[#9c4f65]" /> Verified Student & Tutor Community
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-[#475569] hover:text-[#9c4f65] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/study-groups" className="text-[#475569] hover:text-[#9c4f65] transition-colors">
                  Study Groups
                </Link>
              </li>
              <li>
                <Link href="/tutors" className="text-[#475569] hover:text-[#9c4f65] transition-colors">
                  Find Tutors
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-[#475569] hover:text-[#9c4f65] transition-colors">
                  About the Platform
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-[#475569] hover:text-[#9c4f65] transition-colors">
                  Student & Tutor Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-[#475569] hover:text-[#9c4f65] transition-colors">
                  Join as Student or Tutor
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Support */}
          <div>
            <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider mb-3">
              Support & Help
            </h4>
            <ul className="space-y-2 text-sm text-[#475569]">
              <li className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[#9c4f65]" /> support@studyfinder.edu
              </li>
              <li>Module Help Desk</li>
              <li>Academic Integrity Guide</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#cbd5e1] flex flex-col sm:flex-row justify-between items-center text-xs text-[#64748b]">
          <p>© {new Date().getFullYear()} Study Group & Tutoring Finder. All rights reserved.</p>
          <div className="flex gap-4 mt-3 sm:mt-0">
            <span className="hover:text-[#9c4f65] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[#9c4f65] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#9c4f65] cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
