'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import {
  BookOpen,
  Users,
  GraduationCap,
  ArrowRight,
  Clock,
  CheckCircle2,
  Loader2,
  Mail,
} from 'lucide-react';

interface StudentTutoringRequest {
  id: number;
  student_id: number;
  tutor_id: number;
  course_code: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  updated_at: string;
  tutor_name: string;
  tutor_surname: string;
  tutor_email: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function StudentDashboardPage() {
  const { user, token } = useAuth();

  const [requests, setRequests] = useState<StudentTutoringRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(true);
  const [studyGroupsCount, setStudyGroupsCount] = useState<number>(0);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  /* Fetch user study groups and tutoring requests */
  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      if (!token) return;
      setLoadingRequests(true);
      try {
        // 1. Fetch student's tutoring requests
        const reqPromise = fetch(`${API_BASE_URL}/api/tutoring-requests/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 2. Fetch student's study groups
        const sgPromise = fetch(`${API_BASE_URL}/api/study-groups/user/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const [reqRes, sgRes] = await Promise.all([reqPromise, sgPromise]);
        if (!isMounted) return;

        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setRequests(reqData.requests || []);
        }

        if (sgRes.ok) {
          const sgData = await sgRes.json();
          setStudyGroupsCount(sgData.count || (sgData.study_groups ? sgData.study_groups.length : 0));
        }
      } catch {
        // Soft fail
      } finally {
        if (isMounted) setLoadingRequests(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, [token]);

  /* Cancel a pending request */
  const handleCancelRequest = async (requestId: number) => {
    if (!token) return;
    setCancellingId(requestId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tutoring-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: 'cancelled' } : r))
        );
      }
    } catch {
      // Soft fail
    } finally {
      setCancellingId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const acceptedCount = requests.filter((r) => r.status === 'accepted').length;

  return (
    <ProtectedRoute allowedRole="student">
      <div className="flex-1 py-8 sm:py-12 bg-[#e8edf2] text-[#0f172a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Welcome Banner */}
          <div className="bg-[#f1f4f8] rounded-2xl p-6 sm:p-8 border border-[#cbd5e1] shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fce7ec] border border-[#e89aae] text-[#9c4f65] text-xs font-semibold mb-2">
                <Users className="w-3.5 h-3.5" /> Student Learning Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                Welcome back, {user?.name} {user?.surname}!
              </h1>
              <p className="mt-1 text-sm text-[#475569]">
                Logged in as <span className="font-semibold text-[#334155]">{user?.email}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/tutors"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#d88299] hover:bg-[#c46982] shadow-xs transition-colors"
              >
                <GraduationCap className="w-4 h-4" />
                Find a Tutor
              </Link>
              <Link
                href="/study-groups"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors"
              >
                <Users className="w-4 h-4" />
                Study Groups
              </Link>
            </div>
          </div>

          {/* Dashboard Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* My Study Groups */}
            <div className="bg-[#f1f4f8] rounded-2xl p-6 border border-[#cbd5e1] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  My Study Groups
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#0f172a]">{studyGroupsCount}</div>
              <p className="text-xs text-[#64748b] mt-2">Active module study groups</p>
              <Link
                href="/study-groups"
                className="mt-4 pt-4 border-t border-[#cbd5e1] text-xs text-[#9c4f65] font-semibold flex items-center gap-1 hover:underline"
              >
                Find and join study groups
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Tutoring Sessions */}
            <div className="bg-[#f1f4f8] rounded-2xl p-6 border border-[#cbd5e1] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Tutoring Requests
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#0f172a]">{requests.length}</div>
              <p className="text-xs text-[#64748b] mt-2">
                {acceptedCount} accepted, {pendingCount} pending
              </p>
              <Link
                href="/tutors"
                className="mt-4 pt-4 border-t border-[#cbd5e1] text-xs text-[#9c4f65] font-semibold flex items-center gap-1 hover:underline"
              >
                Connect with verified tutors
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Account Status */}
            <div className="bg-[#f1f4f8] rounded-2xl p-6 border border-[#cbd5e1] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Account Standing
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#9c4f65]">Active Student</div>
              <p className="text-xs text-[#64748b] mt-2">Verified University Member</p>
              <Link
                href="/student/profile"
                className="mt-4 pt-4 border-t border-[#cbd5e1] text-xs text-[#334155] font-semibold flex items-center gap-1 hover:underline"
              >
                Manage student profile
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Student Tutoring Requests Panel */}
          <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#cbd5e1] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#9c4f65]" />
                  My Tutoring Requests &amp; Sessions
                </h2>
                <p className="text-xs text-[#475569] mt-0.5">
                  Track status updates from your peer tutors and coordinate study times.
                </p>
              </div>
              <Link
                href="/tutors"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors"
              >
                + Request a Tutor
              </Link>
            </div>

            <div className="p-6">
              {loadingRequests ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#d88299]" />
                </div>
              ) : requests.length === 0 ? (
                <div className="p-8 text-center bg-[#e8edf2] rounded-xl border border-dashed border-[#cbd5e1] space-y-2">
                  <GraduationCap className="w-8 h-8 text-[#94a3b8] mx-auto" />
                  <p className="text-sm font-semibold text-[#0f172a]">No tutoring requests yet</p>
                  <p className="text-xs text-[#475569] max-w-sm mx-auto">
                    Need assistance in a specific module? Search verified peer tutors and request a personalized study session.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/tutors"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9c4f65] hover:underline"
                    >
                      Browse available tutors now
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-5 rounded-xl bg-[#e8edf2] border border-[#cbd5e1] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#d88299] transition-colors"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae]">
                            {req.course_code}
                          </span>
                          <span className="font-bold text-[#0f172a] text-sm">
                            Tutor {req.tutor_name} {req.tutor_surname}
                          </span>

                          {/* Status Badge */}
                          {req.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending Tutor Response
                            </span>
                          )}
                          {req.status === 'accepted' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Request Accepted
                            </span>
                          )}
                          {req.status === 'declined' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#dce3ec] text-[#64748b] border border-[#cbd5e1]">
                              Declined
                            </span>
                          )}
                          {req.status === 'cancelled' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#dce3ec] text-[#64748b]">
                              Cancelled
                            </span>
                          )}
                        </div>

                        {req.message && (
                          <p className="text-xs text-[#334155] italic bg-[#f1f4f8] p-2.5 rounded-lg border border-[#cbd5e1]">
                            &ldquo;{req.message}&rdquo;
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#64748b]">
                          <span>Requested: {formatDate(req.created_at)}</span>
                          {req.status === 'accepted' && (
                            <span className="text-[#9c4f65] font-medium flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              Tutor contact: <strong className="text-[#0f172a]">{req.tutor_email}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            disabled={cancellingId === req.id}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#475569] hover:text-[#0f172a] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors disabled:opacity-60 cursor-pointer"
                          >
                            {cancellingId === req.id ? 'Cancelling…' : 'Cancel Request'}
                          </button>
                        )}
                        <Link
                          href={`/tutors/${req.tutor_id}`}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors"
                        >
                          View Tutor
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
