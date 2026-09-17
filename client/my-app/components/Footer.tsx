import React from 'react';
import Link from 'next/link';
import { BookOpen, Mail, Shield, GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-100 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-purple flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-purple">
                Study Group & Tutoring Finder
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-md">
              Connecting university students with classmates in their modules to form collaborative
              study groups and receive targeted peer tutoring assistance.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4 text-light-green" /> University Network
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-light-green" /> Verified Student & Tutor Community
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-slate-600 hover:text-light-green transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-600 hover:text-light-green transition-colors">
                  About the Platform
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-slate-600 hover:text-light-green transition-colors">
                  Student & Tutor Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-slate-600 hover:text-light-green transition-colors">
                  Join as Student or Tutor
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Support */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Support & Help
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-light-green" /> support@studyfinder.edu
              </li>
              <li>Module Help Desk</li>
              <li>Academic Integrity Guide</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Study Group & Tutoring Finder. All rights reserved.</p>
          <div className="flex gap-4 mt-3 sm:mt-0">
            <span className="hover:text-light-green cursor-pointer">Privacy Policy</span>
            <span className="hover:text-light-green cursor-pointer">Terms of Service</span>
            <span className="hover:text-light-green cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
