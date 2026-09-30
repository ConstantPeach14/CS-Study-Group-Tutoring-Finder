'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Menu, X, BookOpen, User as UserIcon, LogOut, LayoutDashboard, Users, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/study-groups') {
      return pathname.startsWith('/study-groups');
    }
    if (path === '/tutors') {
      return pathname.startsWith('/tutors');
    }
    return pathname === path;
  };

  // Determine role-specific dashboard and profile paths
  const dashboardPath = user?.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard';
  const profilePath = user?.role === 'tutor' ? '/tutor/profile' : '/student/profile';

  return (
    <header className="sticky top-0 z-50 bg-[#e2e8f0] border-b border-[#cbd5e1] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#d88299] flex items-center justify-center text-[#1e293b] shadow-xs group-hover:bg-[#c46982] transition-colors">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-[#0f172a] group-hover:text-[#9c4f65] transition-colors">
                Study Group & Tutor
              </span>
              <span className="text-[11px] text-[#9c4f65] font-bold -mt-1 tracking-wider uppercase">
                Finder Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {!user ? (
              <>
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/')
                      ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                      : 'text-[#334155] hover:text-[#9c4f65] hover:bg-[#dce3ec]'
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/study-groups"
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/study-groups')
                      ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                      : 'text-[#334155] hover:text-[#9c4f65] hover:bg-[#dce3ec]'
                  }`}
                >
                  Study Groups
                </Link>
                <Link
                  href="/tutors"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/tutors')
                      ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                      : 'text-[#334155] hover:text-[#9c4f65] hover:bg-[#dce3ec]'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Find Tutors
                </Link>
                <Link
                  href="/about"
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/about')
                      ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                      : 'text-[#334155] hover:text-[#9c4f65] hover:bg-[#dce3ec]'
                  }`}
                >
                  About
                </Link>
                <Link
                  href="/login"
                  className={`ml-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/login')
                      ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae]'
                      : 'text-[#334155] hover:text-[#9c4f65] hover:bg-[#dce3ec]'
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="ml-2 px-4 py-2 rounded-xl text-sm font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] border border-[#d47b93] shadow-xs transition-colors"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={dashboardPath}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive(dashboardPath)
                      ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                      : 'text-[#334155] hover:text-[#9c4f65] hover:bg-[#dce3ec]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/study-groups"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/study-groups')
                      ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                      : 'text-[#334155] hover:text-[#9c4f65] hover:bg-[#dce3ec]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Study Groups
                </Link>
                <Link
                  href="/tutors"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/tutors')
                      ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                      : 'text-[#334155] hover:text-[#9c4f65] hover:bg-[#dce3ec]'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Find Tutors
                </Link>
                <Link
                  href={profilePath}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive(profilePath)
                      ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                      : 'text-[#334155] hover:text-[#9c4f65] hover:bg-[#dce3ec]'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  Profile
                </Link>
                <div className="ml-3 pl-3 border-l border-[#cbd5e1] flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] font-bold capitalize">
                    {user.role}
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] border border-[#d47b93] shadow-xs transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </nav>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#334155] hover:text-[#9c4f65] hover:bg-[#dce3ec] transition-colors focus:outline-hidden"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#cbd5e1] bg-[#e2e8f0] px-4 pt-2 pb-4 space-y-1 shadow-md">
          {!user ? (
            <>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-base font-medium ${
                  isActive('/')
                    ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                    : 'text-[#334155] hover:bg-[#dce3ec]'
                }`}
              >
                Home
              </Link>
              <Link
                href="/study-groups"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-base font-medium ${
                  isActive('/study-groups')
                    ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                    : 'text-[#334155] hover:bg-[#dce3ec]'
                }`}
              >
                Study Groups
              </Link>
              <Link
                href="/tutors"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-base font-medium ${
                  isActive('/tutors')
                    ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                    : 'text-[#334155] hover:bg-[#dce3ec]'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
                Find Tutors
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-base font-medium ${
                  isActive('/about')
                    ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                    : 'text-[#334155] hover:bg-[#dce3ec]'
                }`}
              >
                About
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-base font-medium ${
                  isActive('/login')
                    ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                    : 'text-[#334155] hover:bg-[#dce3ec]'
                }`}
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center mt-2 px-4 py-2 rounded-xl text-base font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982]"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#64748b] border-b border-[#cbd5e1] mb-1">
                Signed in as {user.name} ({user.role})
              </div>
              <Link
                href={dashboardPath}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-base font-medium ${
                  isActive(dashboardPath)
                    ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                    : 'text-[#334155] hover:bg-[#dce3ec]'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                href="/study-groups"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-base font-medium ${
                  isActive('/study-groups')
                    ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                    : 'text-[#334155] hover:bg-[#dce3ec]'
                }`}
              >
                <Users className="w-5 h-5" />
                Study Groups
              </Link>
              <Link
                href="/tutors"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-base font-medium ${
                  isActive('/tutors')
                    ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                    : 'text-[#334155] hover:bg-[#dce3ec]'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
                Find Tutors
              </Link>
              <Link
                href={profilePath}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-base font-medium ${
                  isActive(profilePath)
                    ? 'text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] font-bold'
                    : 'text-[#334155] hover:bg-[#dce3ec]'
                }`}
              >
                <UserIcon className="w-5 h-5" />
                Profile
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-center mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-base font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
