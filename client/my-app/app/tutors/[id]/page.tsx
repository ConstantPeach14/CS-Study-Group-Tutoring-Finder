'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Award,
  ArrowLeft,
  Mail,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  X,
  UserCheck,
  XCircle,
  Settings,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */

interface ExistingRequest {
  id: number;
  course_code: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface TutorDetail {
  tutor_id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  user_created_at: string;
  profile_id: number | null;
  bio: string | null;
  subjects: string | null;
  course_codes: string | null;
  qualifications: string | null;
  availability: string | null;
  profile_created_at: string | null;
  profile_updated_at: string | null;
  is_self: boolean;
  my_request: ExistingRequest | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getInitials(name: string, surname: string): string {
  return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function TutorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const tutorId = params?.id as string;

  const [tutor, setTutor] = useState<TutorDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  /* Request modal / form states */
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [requestMessage, setRequestMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  /* Fetch tutor data */
  useEffect(() => {
    let isMounted = true;
    const fetchTutor = async () => {
      if (!tutorId) return;
      setIsLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/api/tutors/${tutorId}`, { headers });
        if (!isMounted) return;

        if (!res.ok) {
          if (res.status === 404) {
            setError('Peer tutor not found.');
          } else {
            setError('Failed to load tutor profile.');
          }
          return;
        }

        const data = await res.json();
        if (isMounted) {
          setTutor(data.tutor);
          // Pre-populate course selection if tutor has course codes
          if (data.tutor.course_codes) {
            const first = data.tutor.course_codes.split(',')[0]?.trim();
            if (first) setSelectedCourse(first);
          }
        }
      } catch {
        if (isMounted) setError('Network error. Please check your connection.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTutor();
    return () => {
      isMounted = false;
    };
  }, [tutorId, token, refreshTrigger]);

  /* Handle submitting a new tutoring request */
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) {
      router.push(`/login?redirect=/tutors/${tutorId}`);
      return;
    }

    if (!selectedCourse.trim()) {
      setSubmitError('Please specify the course code you need help with.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/tutoring-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tutor_id: parseInt(tutorId, 10),
          course_code: selectedCourse.trim().toUpperCase(),
          message: requestMessage.trim() || null,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        setSubmitError(body.error || 'Failed to submit tutoring request.');
        return;
      }

      setSubmitSuccess('Your tutoring request has been sent! The tutor will review it.');
      setShowRequestModal(false);
      setRequestMessage('');
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Render Request Area according to role and request state */
  const renderRequestArea = () => {
    if (!user) {
      return (
        <div className="space-y-3">
          <Link
            href={`/login?redirect=/tutors/${tutorId}`}
            className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-sm font-bold text-white bg-[#d88299] hover:bg-[#c46982] hover:text-white transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
            Log in to Request Tutoring
          </Link>
          <p className="text-xs text-[#475569] text-center">
            Sign in with your student account to book peer tutoring.
          </p>
        </div>
      );
    }

    // Tutor viewing self
    if (tutor?.is_self) {
      return (
        <div className="space-y-3 p-4 rounded-xl bg-[#dce3ec] border border-[#cbd5e1] text-center">
          <p className="text-xs text-[#334155] font-medium">
            This is your public peer tutor profile visible to students.
          </p>
          <Link
            href="/tutor/profile"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Edit Tutor Profile
          </Link>
        </div>
      );
    }

    // Another tutor viewing
    if (user.role === 'tutor') {
      return (
        <div className="p-4 rounded-xl bg-[#dce3ec] border border-[#cbd5e1] text-center text-xs text-[#475569]">
          <GraduationCap className="w-6 h-6 text-[#d88299] mx-auto mb-1.5" />
          You are logged in as a verified tutor. Only students can submit tutoring requests.
        </div>
      );
    }

    // Student has an existing request with this tutor
    const req = tutor?.my_request;
    if (req) {
      if (req.status === 'pending') {
        return (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[#fce7ec] border border-[#9c4f65]/50 flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#d88299] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-[#d88299] text-[#e8edf2]">
                  Request Pending
                </span>
                <p className="text-xs text-[#334155]">
                  Your request for <strong className="text-[#0f172a]">{req.course_code}</strong> was sent on {formatDate(req.created_at)}.
                </p>
                <p className="text-[11px] text-[#475569]">
                  Awaiting confirmation from Tutor {tutor.name}.
                </p>
              </div>
            </div>
          </div>
        );
      }

      if (req.status === 'accepted') {
        return (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[#fce7ec] border border-[#e89aae]/50 space-y-2">
              <div className="flex items-center gap-2 text-[#d88299] font-bold text-xs">
                <UserCheck className="w-4 h-4" />
                Request Accepted!
              </div>
              <p className="text-xs text-[#334155]">
                Tutor {tutor.name} accepted your tutoring request for <strong className="text-[#0f172a]">{req.course_code}</strong>.
              </p>
              <div className="pt-2 border-t border-[#e89aae]/30 flex items-center gap-2 text-xs text-[#334155]">
                <Mail className="w-3.5 h-3.5 text-[#d88299]" />
                Contact: <span className="font-semibold text-white">{tutor.email}</span>
              </div>
            </div>

            <button
              onClick={() => setShowRequestModal(true)}
              className="w-full px-4 py-2 rounded-xl text-xs font-semibold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors"
            >
              Request Another Session
            </button>
          </div>
        );
      }

      if (req.status === 'declined') {
        return (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[#22171c] border border-red-900/40 space-y-1">
              <div className="flex items-center gap-1.5 text-[#d88299] font-bold text-xs">
                <XCircle className="w-4 h-4" />
                Request Declined
              </div>
              <p className="text-xs text-[#334155]">
                The tutor was unavailable for the requested schedule. You may submit a new request or explore other tutors.
              </p>
            </div>

            <button
              onClick={() => setShowRequestModal(true)}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#d88299] hover:bg-[#c46982] hover:text-white transition-colors"
            >
              Send New Request
            </button>
          </div>
        );
      }
    }

    // Default student state: Can request tutoring
    return (
      <div className="space-y-2">
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-sm font-bold text-white bg-[#d88299] hover:bg-[#c46982] hover:text-white transition-colors shadow-md cursor-pointer"
        >
          <Send className="w-4 h-4" />
          Request Tutoring
        </button>
        <p className="text-[11px] text-[#475569] text-center">
          Send your module topic and schedule preference.
        </p>
      </div>
    );
  };

  /* ─── Loading & Error Skeletons ───────────────────────────── */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#e8edf2] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d88299]" />
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="min-h-screen bg-[#e8edf2] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-[#d88299] mx-auto" />
          <h1 className="text-lg font-bold text-white">{error || 'Tutor not found'}</h1>
          <p className="text-sm text-[#475569]">
            This peer tutor profile could not be located or may have been updated.
          </p>
          <Link
            href="/tutors"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tutors
          </Link>
        </div>
      </div>
    );
  }

  const courseList = tutor.course_codes
    ? tutor.course_codes.split(',').map((c) => c.trim())
    : [];

  return (
    <>
      {/* ── Request Modal ────────────────────────────────────── */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#f1f4f8] rounded-2xl shadow-2xl border border-[#cbd5e1] max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#d88299]" />
                <h3 className="text-base font-bold text-white">
                  Request Tutoring from {tutor.name}
                </h3>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-[#475569] hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-[#fce7ec] border border-[#9c4f65]/50 text-xs text-[#d88299] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSendRequest} className="space-y-4">
              {/* Course Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#334155] uppercase tracking-wider mb-1.5">
                  Course / Module Code *
                </label>
                {courseList.length > 0 ? (
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full bg-[#e8edf2] border border-[#cbd5e1] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-[#d88299] transition-colors"
                    required
                  >
                    {courseList.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                    <option value="OTHER">Other / Custom Course</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    placeholder="e.g., CSC101"
                    className="w-full bg-[#e8edf2] border border-[#cbd5e1] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-[#d88299] transition-colors"
                    required
                  />
                )}
                {selectedCourse === 'OTHER' && (
                  <input
                    type="text"
                    placeholder="Enter custom course code (e.g., INF201)"
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full mt-2 bg-[#e8edf2] border border-[#cbd5e1] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-hidden focus:border-[#d88299]"
                    required
                  />
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-[#334155] uppercase tracking-wider mb-1.5">
                  Tutoring Goals & Topics (Optional)
                </label>
                <textarea
                  rows={4}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Describe the topics you'd like to cover (e.g., recursion, proof by induction, exam prep) and preferred meeting times..."
                  className="w-full bg-[#e8edf2] border border-[#cbd5e1] rounded-xl p-3 text-sm text-white placeholder-[#94a3b8] focus:outline-hidden focus:border-[#d88299] transition-colors"
                  maxLength={1000}
                />
                <span className="text-[11px] text-[#64748b] float-right">
                  {1000 - requestMessage.length} characters left
                </span>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-[#cbd5e1]">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#d88299] hover:bg-[#c46982] hover:text-white transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? 'Sending…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Main Detail Content ──────────────────────────────── */}
      <div className="min-h-screen bg-[#e8edf2] py-8 sm:py-12 text-[#0f172a]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Breadcrumb Back */}
          <Link
            href="/tutors"
            className="inline-flex items-center gap-2 text-sm text-[#475569] hover:text-[#d88299] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tutors
          </Link>

          {/* Success Banner if just requested */}
          {submitSuccess && (
            <div className="p-4 rounded-2xl bg-[#fce7ec] border border-[#e89aae]/50 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#d88299] shrink-0 mt-0.5" />
              <div className="text-xs text-[#334155]">
                <strong>Request Sent: </strong>
                {submitSuccess}
              </div>
            </div>
          )}

          {/* ── Tutor Profile Hero Banner ──────────────────────── */}
          <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-[#fce7ec] border-2 border-[#9c4f65]/60 flex items-center justify-center text-[#d88299] font-extrabold text-2xl shadow-md shrink-0">
                  {getInitials(tutor.name, tutor.surname)}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#fce7ec] text-[#d88299] border border-[#e89aae]/40 text-xs font-semibold mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified University Tutor
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {tutor.name} {tutor.surname}
                  </h1>
                  <p className="text-xs text-[#475569] mt-0.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#d88299]" />
                    {tutor.email}
                  </p>
                </div>
              </div>

              {/* Action / Request Widget */}
              <div className="w-full sm:w-auto shrink-0 min-w-[220px]">
                {renderRequestArea()}
              </div>
            </div>
          </div>

          {/* ── Detailed Columns ──────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Bio, Courses, Qualifications */}
            <div className="lg:col-span-2 space-y-6">

              {/* Bio */}
              <section className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] p-6 space-y-3 shadow-sm">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#d88299]" />
                  About the Tutor
                </h2>
                <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
                  {tutor.bio || 'Verified university peer tutor dedicated to collaborative learning and academic excellence.'}
                </p>
              </section>

              {/* Subjects & Modules */}
              <section className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] p-6 space-y-4 shadow-sm">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#d88299]" />
                  Courses & Subjects
                </h2>

                <div>
                  <span className="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">
                    Subject Areas
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(tutor.subjects || 'Computer Science').split(',').map((sub) => (
                      <span
                        key={sub.trim()}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-[#dce3ec] text-[#334155] border border-[#cbd5e1]"
                      >
                        {sub.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">
                    Supported Module Codes
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {courseList.map((code) => (
                      <span
                        key={code}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-[#fce7ec] text-[#d88299] border border-[#9c4f65]/40"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              {/* Qualifications */}
              {tutor.qualifications && (
                <section className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] p-6 space-y-2 shadow-sm">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#d88299]" />
                    Academic Credentials & Qualifications
                  </h2>
                  <p className="text-sm text-[#334155] leading-relaxed">
                    {tutor.qualifications}
                  </p>
                </section>
              )}
            </div>

            {/* Right: Availability, Logistics, Info */}
            <div className="space-y-6">

              {/* Availability */}
              <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] p-6 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#d88299]" />
                  Tutoring Schedule
                </h3>
                <div className="p-3.5 rounded-xl bg-[#e8edf2] border border-[#cbd5e1] text-xs font-medium text-[#334155]">
                  {tutor.availability || 'Flexible schedule — contact tutor via request.'}
                </div>
                <p className="text-[11px] text-[#475569]">
                  Specific hours and physical or virtual venues are coordinated upon session acceptance.
                </p>
              </div>

              {/* Tutor Meta */}
              <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] p-6 space-y-3 shadow-sm">
                <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                  Verification Status
                </h3>
                <dl className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#cbd5e1]">
                    <dt className="text-[#475569]">Role</dt>
                    <dd className="font-semibold text-white capitalize">{tutor.role}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#cbd5e1]">
                    <dt className="text-[#475569]">Profile Status</dt>
                    <dd className="font-semibold text-[#d88299]">Active</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-[#475569]">Member Since</dt>
                    <dd className="font-semibold text-white">{formatDate(tutor.user_created_at)}</dd>
                  </div>
                </dl>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
