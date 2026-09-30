'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import {
  GraduationCap,
  Users,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  ArrowRight,
  Settings,
} from 'lucide-react';

interface TutoringRequest {
  id: number;
  student_id: number;
  tutor_id: number;
  course_code: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  updated_at: string;
  student_name: string;
  student_surname: string;
  student_email: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function TutorDashboardPage() {
  const { user, token } = useAuth();

  const [requests, setRequests] = useState<TutoringRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  /* Fetch incoming tutoring requests */
  useEffect(() => {
    let isMounted = true;
    const fetchRequests = async () => {
      if (!token) return;
      setLoadingRequests(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/tutoring-requests/received`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests || []);
        }
      } catch {
        // Soft fail
      } finally {
        if (isMounted) setLoadingRequests(false);
      }
    };

    fetchRequests();
    return () => {
      isMounted = false;
    };
  }, [token]);

  /* Handle Accept / Decline */
  const handleUpdateStatus = async (requestId: number, newStatus: 'accepted' | 'declined') => {
    if (!token) return;
    setActionInProgress(requestId);
    setFeedbackMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/tutoring-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
        );
        setFeedbackMessage(
          newStatus === 'accepted'
            ? 'Request accepted! You can coordinate meeting times via student email.'
            : 'Request marked as declined.'
        );
      }
    } catch {
      setFeedbackMessage('Failed to update request. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const acceptedSessions = requests.filter((r) => r.status === 'accepted');

  return (
    <ProtectedRoute allowedRole="tutor">
      <div className="flex-1 py-8 sm:py-12 bg-[#e8edf2] text-[#0f172a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Welcome Banner */}
          <div className="bg-[#f1f4f8] rounded-2xl p-6 sm:p-8 border border-[#cbd5e1] shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fce7ec] border border-[#e89aae] text-[#9c4f65] text-xs font-semibold mb-2">
                <GraduationCap className="w-3.5 h-3.5" /> Peer Tutor Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                Welcome, Tutor {user?.name} {user?.surname}!
              </h1>
              <p className="mt-1 text-sm text-[#475569]">
                Tutor account: <span className="font-semibold text-[#334155]">{user?.email}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/tutor/profile"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#d88299] hover:bg-[#c46982] shadow-xs transition-colors"
              >
                <Settings className="w-4 h-4" />
                Manage Tutor Profile
              </Link>
              <Link
                href="/tutors"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors"
              >
                <Users className="w-4 h-4" />
                View Tutor Finder
              </Link>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#f1f4f8] rounded-2xl p-6 border border-[#cbd5e1] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Student Inquiries
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#0f172a]">
                {pendingRequests.length}
              </div>
              <p className="text-xs text-[#64748b] mt-2">Pending tutoring requests</p>
              <div className="mt-4 pt-4 border-t border-[#cbd5e1] text-xs text-[#9c4f65] font-semibold">
                Incoming student inquiries
              </div>
            </div>

            <div className="bg-[#f1f4f8] rounded-2xl p-6 border border-[#cbd5e1] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Tutoring Sessions
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-[#0f172a]">
                {acceptedSessions.length}
              </div>
              <p className="text-xs text-[#64748b] mt-2">Accepted active tutoring pairings</p>
              <div className="mt-4 pt-4 border-t border-[#cbd5e1] text-xs text-[#9c4f65] font-semibold">
                Confirmed peer sessions
              </div>
            </div>

            <div className="bg-[#f1f4f8] rounded-2xl p-6 border border-[#cbd5e1] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Tutor Standing
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#9c4f65]">Active</div>
              <p className="text-xs text-[#64748b] mt-2">Verified University Tutor</p>
              <div className="mt-4 pt-4 border-t border-[#cbd5e1] text-xs text-[#9c4f65] font-semibold">
                Discoverable in Tutor Finder
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {feedbackMessage && (
            <div className="p-4 rounded-xl bg-[#fce7ec] border border-[#e89aae] text-xs text-[#9c4f65] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* Incoming Tutoring Requests Management Panel */}
          <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#cbd5e1] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#9c4f65]" />
                  Incoming Student Tutoring Requests
                </h2>
                <p className="text-xs text-[#475569] mt-0.5">
                  Review student requests, module topics, and respond directly.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#dce3ec] text-[#334155] border border-[#cbd5e1]">
                {requests.length} total
              </span>
            </div>

            <div className="p-6">
              {loadingRequests ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#d88299]" />
                </div>
              ) : requests.length === 0 ? (
                <div className="p-8 text-center bg-[#e8edf2] rounded-xl border border-dashed border-[#cbd5e1] space-y-2">
                  <Calendar className="w-8 h-8 text-[#94a3b8] mx-auto" />
                  <p className="text-sm font-semibold text-[#0f172a]">No incoming tutoring requests yet</p>
                  <p className="text-xs text-[#475569] max-w-sm mx-auto">
                    Ensure your tutor profile lists your supported courses and availability so students can find and request you.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/tutor/profile"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9c4f65] hover:underline"
                    >
                      Update supported courses &amp; schedule
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
                            {req.student_name} {req.student_surname}
                          </span>
                          <span className="text-xs text-[#64748b]">({req.student_email})</span>

                          {/* Status Badge */}
                          {req.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae]">
                              Pending Review
                            </span>
                          )}
                          {req.status === 'accepted' && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae]">
                              Accepted
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

                        <p className="text-[11px] text-[#64748b]">
                          Submitted on {formatDate(req.created_at)}
                        </p>
                      </div>

                      {/* Actions for Pending Requests */}
                      {req.status === 'pending' ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'accepted')}
                            disabled={actionInProgress === req.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors disabled:opacity-60 cursor-pointer shadow-xs"
                          >
                            {actionInProgress === req.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'declined')}
                            disabled={actionInProgress === req.id}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors disabled:opacity-60 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5 text-[#64748b]" />
                            Decline
                          </button>
                        </div>
                      ) : req.status === 'accepted' ? (
                        <div className="text-xs text-[#9c4f65] font-medium flex items-center gap-1.5 shrink-0">
                          <Mail className="w-4 h-4" />
                          Coordinate via student email
                        </div>
                      ) : null}
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
