'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import {
  GraduationCap,
  ArrowLeft,
  LayoutDashboard,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  Save,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ProfileForm {
  bio: string;
  subjects: string;
  course_codes: string;
  qualifications: string;
  availability: string;
}

export default function TutorProfilePage() {
  const { user, token } = useAuth();

  const [formData, setFormData] = useState<ProfileForm>({
    bio: '',
    subjects: '',
    course_codes: '',
    qualifications: '',
    availability: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* Load existing tutor profile */
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      if (!token) return;
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/tutors/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          if (p) {
            setFormData({
              bio: p.bio || '',
              subjects: p.subjects || '',
              course_codes: p.course_codes || '',
              qualifications: p.qualifications || '',
              availability: p.availability || '',
            });
          }
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Could not load existing profile. You can fill out your information below.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [token]);

  /* Handle form submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.subjects.trim()) {
      setErrorMessage('Subjects area is required (e.g., Computer Science, Mathematics).');
      return;
    }
    if (!formData.course_codes.trim()) {
      setErrorMessage('Course codes are required (e.g., CSC101, MAM100).');
      return;
    }
    if (!formData.availability.trim()) {
      setErrorMessage('Availability schedule is required (e.g., Weekdays 14:00 - 18:00).');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/tutors/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bio: formData.bio.trim() || null,
          subjects: formData.subjects.trim(),
          course_codes: formData.course_codes.trim().toUpperCase(),
          qualifications: formData.qualifications.trim() || null,
          availability: formData.availability.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update tutor profile.');
        return;
      }

      setSaveSuccess('Tutor profile successfully updated and live in the Tutor Finder!');
    } catch {
      setErrorMessage('Network error while saving profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <ProtectedRoute allowedRole="tutor">
      <div className="flex-1 py-10 sm:py-14 bg-[#e8edf2] text-[#0f172a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Back Navigation & Public Profile Link */}
          <div className="flex justify-between items-center">
            <Link
              href="/tutor/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#475569] hover:text-[#9c4f65] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tutor Dashboard
            </Link>

            {user?.id && (
              <Link
                href={`/tutors/${user.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9c4f65] hover:underline"
              >
                <Eye className="w-4 h-4" />
                View Public Profile
              </Link>
            )}
          </div>

          {/* Profile Card */}
          <div className="bg-[#f1f4f8] rounded-2xl shadow-md border border-[#cbd5e1] overflow-hidden">
            {/* Header banner */}
            <div className="bg-[#dce3ec] border-b border-[#cbd5e1] p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="w-20 h-20 rounded-2xl bg-[#fce7ec] text-[#9c4f65] border-2 border-[#e89aae] flex items-center justify-center font-extrabold text-2xl shadow-md">
                  {user?.name?.[0]?.toUpperCase()}{user?.surname?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] text-xs font-semibold mb-2">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Verified Peer Tutor
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
                    Tutor {user?.name} {user?.surname}
                  </h1>
                  <p className="text-xs text-[#475569] mt-0.5">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            {saveSuccess && (
              <div className="m-6 p-4 rounded-xl bg-[#fce7ec] border border-[#e89aae] text-xs text-[#9c4f65] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}
            {errorMessage && (
              <div className="m-6 p-4 rounded-xl bg-[#fce7ec] border border-[#e89aae] text-xs text-[#9c4f65] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Section */}
            <div className="p-6 sm:p-8 space-y-8">
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#d88299]" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#334155] border-b border-[#cbd5e1] pb-2 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#9c4f65]" />
                      Academic &amp; Tutoring Information
                    </h2>
                    <p className="text-xs text-[#475569] mt-1">
                      This information appears in the public Tutor Finder catalog so students can discover you.
                    </p>
                  </div>

                  {/* Subjects */}
                  <div>
                    <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                      Subject / Course Areas *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Computer Science, Discrete Mathematics, Data Structures"
                      value={formData.subjects}
                      onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                      className="w-full bg-[#e8edf2] border border-[#cbd5e1] rounded-xl px-4 py-2.5 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-hidden focus:border-[#d88299] focus:ring-1 focus:ring-[#d88299] transition-colors"
                      maxLength={255}
                      required
                    />
                    <span className="text-[11px] text-[#64748b] mt-1 block">
                      Separate multiple areas with commas.
                    </span>
                  </div>

                  {/* Course Codes */}
                  <div>
                    <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                      Course / Module Codes Supported *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., CSC101, CSC102, MAM100, INF202"
                      value={formData.course_codes}
                      onChange={(e) => setFormData({ ...formData, course_codes: e.target.value })}
                      className="w-full bg-[#e8edf2] border border-[#cbd5e1] rounded-xl px-4 py-2.5 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-hidden focus:border-[#d88299] focus:ring-1 focus:ring-[#d88299] transition-colors uppercase"
                      maxLength={255}
                      required
                    />
                    <span className="text-[11px] text-[#64748b] mt-1 block">
                      University module codes (e.g., CSC101, MAM100).
                    </span>
                  </div>

                  {/* Availability */}
                  <div>
                    <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                      Weekly Availability Schedule *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Mondays & Thursdays 14:00 - 18:00, Saturday mornings"
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                      className="w-full bg-[#e8edf2] border border-[#cbd5e1] rounded-xl px-4 py-2.5 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-hidden focus:border-[#d88299] focus:ring-1 focus:ring-[#d88299] transition-colors"
                      maxLength={255}
                      required
                    />
                  </div>

                  {/* Qualifications */}
                  <div>
                    <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                      Academic Credentials / Qualifications
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 2nd Year BSc Computer Science (Dean's Merit List, Distinction in CSC101)"
                      value={formData.qualifications}
                      onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                      className="w-full bg-[#e8edf2] border border-[#cbd5e1] rounded-xl px-4 py-2.5 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-hidden focus:border-[#d88299] focus:ring-1 focus:ring-[#d88299] transition-colors"
                      maxLength={255}
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
                      Tutor Bio / Teaching Approach
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Share your background, study methods, and how you assist students with difficult concepts..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full bg-[#e8edf2] border border-[#cbd5e1] rounded-xl p-3 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-hidden focus:border-[#d88299] focus:ring-1 focus:ring-[#d88299] transition-colors"
                      maxLength={1000}
                    />
                    <span className="text-[11px] text-[#64748b] float-right">
                      {1000 - formData.bio.length} characters left
                    </span>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-[#cbd5e1] flex items-center justify-between">
                    <span className="text-xs text-[#475569]">
                      Changes update immediately across the platform.
                    </span>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors disabled:opacity-60 cursor-pointer shadow-md"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isSaving ? 'Saving Profile…' : 'Save Tutor Profile'}
                    </button>
                  </div>
                </form>
              )}

              {/* Account Credentials Summary */}
              <div className="pt-6 border-t border-[#cbd5e1]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-4">
                  Account Credentials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#e8edf2] border border-[#cbd5e1]">
                    <span className="text-[#64748b] block mb-0.5">Full Name</span>
                    <span className="font-semibold text-[#0f172a]">{user?.name} {user?.surname}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#e8edf2] border border-[#cbd5e1]">
                    <span className="text-[#64748b] block mb-0.5">Email</span>
                    <span className="font-semibold text-[#0f172a]">{user?.email}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#e8edf2] border border-[#cbd5e1]">
                    <span className="text-[#64748b] block mb-0.5">Verified Role</span>
                    <span className="font-semibold text-[#9c4f65] capitalize">{user?.role}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#e8edf2] border border-[#cbd5e1]">
                    <span className="text-[#64748b] block mb-0.5">Account Created</span>
                    <span className="font-semibold text-[#0f172a]">{formattedDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="bg-[#dce3ec] px-6 sm:px-8 py-4 border-t border-[#cbd5e1] flex justify-between items-center">
              <Link
                href="/tutor/dashboard"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#334155] hover:text-[#9c4f65] transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Return to Dashboard
              </Link>

              {user?.id && (
                <Link
                  href={`/tutors/${user.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] hover:bg-[#f8d4e0] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview Public Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
