'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { LogIn, AlertCircle, Loader2, BookOpen } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email.trim(), password);

      if (!result.success) {
        setErrorMessage(result.error || 'Invalid credentials. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Successful login -> Redirect according to user role
      if (result.user?.role === 'tutor') {
        router.push('/tutor/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again later.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#e8edf2] text-[#0f172a]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#fce7ec] border border-[#e89aae] flex items-center justify-center text-[#9c4f65] shadow-sm mb-3">
          <BookOpen className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
          Sign In to Your Account
        </h2>
        <p className="mt-2 text-sm text-[#475569]">
          Access your student or tutor study portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#f1f4f8] py-8 px-4 shadow-md border border-[#cbd5e1] sm:rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-6 rounded-xl bg-[#fce7ec] border border-[#e89aae] p-4 text-sm text-[#9c4f65] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                Email Address
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="appearance-none block w-full px-3.5 py-2.5 bg-[#e8edf2] border border-[#cbd5e1] rounded-xl text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-hidden focus:border-[#d88299] focus:ring-1 focus:ring-[#d88299] transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                Password
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none block w-full px-3.5 py-2.5 bg-[#e8edf2] border border-[#cbd5e1] rounded-xl text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-hidden focus:border-[#d88299] focus:ring-1 focus:ring-[#d88299] transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#d88299] hover:bg-[#c46982] focus:outline-hidden shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-[#cbd5e1] pt-6 text-center text-xs text-[#475569]">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="font-bold text-[#9c4f65] hover:underline">
              Register as Student or Tutor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
