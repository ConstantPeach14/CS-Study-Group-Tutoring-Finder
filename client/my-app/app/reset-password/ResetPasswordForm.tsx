'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!token) {
      setErrorMessage('This password reset link is invalid or has expired.');
      return;
    }
    if (!password || !confirmPassword) {
      setErrorMessage('Please enter and confirm your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Unable to reset your password. Please request a new link.');
        return;
      }

      setSuccessMessage(data.message);
      setPassword('');
      setConfirmPassword('');
    } catch {
      setErrorMessage('Could not connect to the server. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#e8edf2] text-[#0f172a]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#fce7ec] border border-[#e89aae] flex items-center justify-center text-[#9c4f65] shadow-sm mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Reset Your Password</h1>
        <p className="mt-2 text-sm text-[#475569]">Choose a new password for your account.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#f1f4f8] py-8 px-4 shadow-md border border-[#cbd5e1] sm:rounded-2xl sm:px-10">
          {(errorMessage || !token) && (
            <div role="alert" className="mb-6 rounded-xl bg-[#fce7ec] border border-[#e89aae] p-4 text-sm text-[#9c4f65] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage || 'This password reset link is invalid or has expired.'}</span>
            </div>
          )}
          {successMessage ? (
            <div role="status" className="rounded-xl bg-[#fce7ec] border border-[#e89aae] p-4 text-sm text-[#9c4f65]">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
              <Link
                href="/login"
                className="mt-5 w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                    New Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-[#fce7ec] border-2 border-[#e89aae] rounded-xl text-sm text-[#0f172a] focus:outline-hidden focus:border-[#d88299] focus:ring-2 focus:ring-[#d88299] transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-1.5 block w-full px-3.5 py-2.5 bg-[#fce7ec] border-2 border-[#e89aae] rounded-xl text-sm text-[#0f172a] focus:outline-hidden focus:border-[#d88299] focus:ring-2 focus:ring-[#d88299] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !token}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#d88299] hover:bg-[#c46982] shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
              <div className="mt-6 border-t border-[#cbd5e1] pt-6 text-center text-xs">
                <Link href="/login" className="font-bold text-[#9c4f65] hover:underline">
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
