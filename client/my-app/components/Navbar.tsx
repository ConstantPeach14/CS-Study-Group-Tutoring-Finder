'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Menu, X, BookOpen, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  // Determine role-specific dashboard and profile paths
  const dashboardPath = user?.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard';
  const profilePath = user?.role === 'tutor' ? '/tutor/profile' : '/student/profile';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-lg bg-purple flex items-center justify-center text-white shadow-xs group-hover:bg-purple-hover transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-purple">
                Study Group & Tutor
              </span>
              <span className="text-[11px] text-slate-500 font-medium -mt-1 tracking-wider uppercase">
                Finder Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/')
                      ? 'text-purple bg-slate-100 font-semibold'
                      : 'text-slate-700 hover:text-light-green hover:bg-slate-50'
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/about')
                      ? 'text-purple bg-slate-100 font-semibold'
                      : 'text-slate-700 hover:text-light-green hover:bg-slate-50'
                  }`}
                >
                  About
                </Link>
                <Link
                  href="/login"
                  className={`ml-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/login')
                      ? 'text-purple bg-slate-100 font-semibold'
                      : 'text-light-green hover:bg-sky-50'
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="ml-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-purple hover:bg-purple-hover shadow-xs transition-colors"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={dashboardPath}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(dashboardPath)
                      ? 'text-purple bg-slate-100 font-semibold'
                      : 'text-slate-700 hover:text-light-green hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href={profilePath}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(profilePath)
                      ? 'text-purple bg-slate-100 font-semibold'
                      : 'text-slate-700 hover:text-light-green hover:bg-slate-50'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  Profile
                </Link>
                <div className="ml-3 pl-3 border-l border-slate-200 flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium capitalize">
                    {user.role}
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium text-white bg-purple hover:bg-purple-hover shadow-xs transition-colors cursor-pointer"
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
              className="p-2 rounded-md text-slate-600 hover:text-purple hover:bg-slate-100 transition-colors focus:outline-hidden"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-md">
          {!user ? (
            <>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/')
                    ? 'text-purple bg-slate-100 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Home
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/about')
                    ? 'text-purple bg-slate-100 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                About
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/login')
                    ? 'text-purple bg-slate-100 font-semibold'
                    : 'text-light-green hover:bg-sky-50'
                }`}
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center mt-2 px-4 py-2 rounded-md text-base font-medium text-white bg-purple hover:bg-purple-hover"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 mb-1">
                Signed in as {user.name} ({user.role})
              </div>
              <Link
                href={dashboardPath}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                  isActive(dashboardPath)
                    ? 'text-purple bg-slate-100 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                href={profilePath}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                  isActive(profilePath)
                    ? 'text-purple bg-slate-100 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
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
                className="w-full text-center mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-base font-medium text-white bg-purple hover:bg-purple-hover cursor-pointer"
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
