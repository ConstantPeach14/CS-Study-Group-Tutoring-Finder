'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, AlertCircle, CheckCircle2, Loader2, BookOpen, GraduationCap, Users } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'tutor',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Frontend validation
    if (!formData.name.trim() || !formData.surname.trim()) {
      setErrorMessage('Please enter both your name and surname.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register({
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Registration failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch {
      setErrorMessage('An unexpected server error occurred. Please try again later.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-purple flex items-center justify-center text-white shadow-xs mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Your Account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Join your university peer study and tutoring network
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-xl shadow-xs border border-slate-200">
          {/* Error Alert Box */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Alert Box */}
          {successMessage && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name & Surname grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  First Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:border-light-green focus:ring-1 focus:ring-light-green transition-colors"
                />
              </div>

              <div>
                <label htmlFor="surname" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Surname
                </label>
                <input
                  id="surname"
                  name="surname"
                  type="text"
                  required
                  value={formData.surname}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:border-light-green focus:ring-1 focus:ring-light-green transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="student@university.edu"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:border-light-green focus:ring-1 focus:ring-light-green transition-colors"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.role === 'student'
                      ? 'border-purple bg-slate-50 text-purple font-semibold ring-1 ring-purple'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === 'student'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <Users className="w-5 h-5 mb-1 text-purple" />
                  <span className="text-sm">Student</span>
                  <span className="text-[11px] text-slate-500 font-normal">Join study groups</span>
                </label>

                <label
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.role === 'tutor'
                      ? 'border-purple bg-slate-50 text-purple font-semibold ring-1 ring-purple'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="tutor"
                    checked={formData.role === 'tutor'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <GraduationCap className="w-5 h-5 mb-1 text-light-green" />
                  <span className="text-sm">Tutor</span>
                  <span className="text-[11px] text-slate-500 font-normal">Provide tutoring</span>
                </label>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:border-light-green focus:ring-1 focus:ring-light-green transition-colors"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-hidden focus:border-light-green focus:ring-1 focus:ring-light-green transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-purple hover:bg-purple-hover shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Register Account
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Already registered?{' '}
              <Link href="/login" className="font-semibold text-light-green hover:underline">
                Sign in to your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
