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
  User,
  Shield,
  BookOpen,
  MapPin,
  Eye,
  AlertCircle,
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

interface TutorProfile {
  tutor_id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  profile_id: number | null;
  bio: string | null;
  subjects: string | null;
  course_codes: string | null;
  qualifications: string | null;
  availability: string | null;
}

interface StudyGroup {
  id: number;
  title: string;
  course_code: string;
  description: string | null;
  meeting_schedule: string;
  location: string;
  max_members: number;
  created_by: number;
  member_count: number;
  is_full: boolean;
  is_member: boolean;
  is_creator: boolean;
  creator_name: string;
  creator_surname: string;
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
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(true);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* Fetch all dashboard data */
  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      if (!token) return;
      setLoadingRequests(true);
      setLoadingProfile(true);
      setLoadingGroups(true);
      setErrorMessage(null);
      try {
        // 1. Fetch incoming tutoring requests
        const reqPromise = fetch(`${API_BASE_URL}/api/tutoring-requests/received`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 2. Fetch tutor profile
        const profilePromise = fetch(`${API_BASE_URL}/api/tutors/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 3. Fetch study groups
        const sgPromise = fetch(`${API_BASE_URL}/api/study-groups/user/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const [reqRes, profileRes, sgRes] = await Promise.all([
          reqPromise,
          profilePromise,
          sgPromise,
        ]);
        if (!isMounted) return;

        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setRequests(reqData.requests || []);
        } else if (reqRes.status === 401) {
          setErrorMessage('Your session has expired. Please log in again.');
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setTutorProfile(profileData.profile || null);
        }

        if (sgRes.ok) {
          const sgData = await sgRes.json();
          setStudyGroups(sgData.study_groups || []);
        }

      } catch {
        if (isMounted) {
          setErrorMessage('Could not connect to the server. Please check your connection and try again.');
        }
      } finally {
        if (isMounted) {
          setLoadingRequests(false);
          setLoadingProfile(false);
          setLoadingGroups(false);
        }
      }
    };

    fetchDashboardData();
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
  const hasProfile = tutorProfile?.profile_id != null;
  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

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
                href="/study-groups"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors"
              >
                <Users className="w-4 h-4" />
                Study Groups
              </Link>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-xl bg-[#fce7ec] border border-[#e89aae] p-4 text-sm text-[#9c4f65] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Actions */}
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/tutor/profile"
              className="bg-[#f1f4f8] rounded-2xl p-4 border border-[#cbd5e1] shadow-sm hover:border-[#d88299] hover:shadow-md transition-all group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] flex items-center justify-center mx-auto mb-3 group-hover:bg-[#d88299] group-hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-[#0f172a]">Tutor Profile</span>
              <p className="text-[11px] text-[#64748b] mt-0.5">Manage your listing</p>
            </Link>
            <Link
              href="/study-groups"
              className="bg-[#f1f4f8] rounded-2xl p-4 border border-[#cbd5e1] shadow-sm hover:border-[#d88299] hover:shadow-md transition-all group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] flex items-center justify-center mx-auto mb-3 group-hover:bg-[#d88299] group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-[#0f172a]">Study Groups</span>
              <p className="text-[11px] text-[#64748b] mt-0.5">Browse &amp; create groups</p>
            </Link>
            <Link
              href="/study-groups/create"
              className="bg-[#f1f4f8] rounded-2xl p-4 border border-[#cbd5e1] shadow-sm hover:border-[#d88299] hover:shadow-md transition-all group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] flex items-center justify-center mx-auto mb-3 group-hover:bg-[#d88299] group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-[#0f172a]">Create Group</span>
              <p className="text-[11px] text-[#64748b] mt-0.5">Start a study group</p>
            </Link>
            {user?.id && (
              <Link
                href={`/tutors/${user.id}`}
                className="bg-[#f1f4f8] rounded-2xl p-4 border border-[#cbd5e1] shadow-sm hover:border-[#d88299] hover:shadow-md transition-all group text-center col-span-2 sm:col-span-1"
              >
                <div className="w-10 h-10 rounded-xl bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] flex items-center justify-center mx-auto mb-3 group-hover:bg-[#d88299] group-hover:text-white transition-colors">
                  <Eye className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-[#0f172a]">Public Profile</span>
                <p className="text-[11px] text-[#64748b] mt-0.5">Preview your listing</p>
              </Link>
            )}
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Student Inquiries */}
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

            {/* Tutoring Sessions */}
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

            {/* Tutor Standing */}
            <div className="bg-[#f1f4f8] rounded-2xl p-6 border border-[#cbd5e1] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                  Tutor Standing
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#9c4f65]">{hasProfile ? 'Active' : 'Incomplete'}</div>
              <p className="text-xs text-[#64748b] mt-2">
                {hasProfile ? 'Discoverable in Tutor Finder' : 'Profile setup needed'}
              </p>
              <Link
                href="/tutor/profile"
                className="mt-4 pt-4 border-t border-[#cbd5e1] text-xs text-[#9c4f65] font-semibold flex items-center gap-1 hover:underline"
              >
                {hasProfile ? 'Edit tutor profile' : 'Complete tutor profile'}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>


          {/* Tutor Profile Summary */}
          <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#cbd5e1] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#9c4f65]" />
                  Tutor Profile Summary
                </h2>
                <p className="text-xs text-[#475569] mt-0.5">
                  Your public tutor listing information visible to students.
                </p>
              </div>
              <Link
                href="/tutor/profile"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors"
              >
                {hasProfile ? 'Edit Profile' : 'Create Profile'}
              </Link>
            </div>

            <div className="p-6">
              {loadingProfile ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#d88299]" />
                </div>
              ) : !hasProfile ? (
                <div className="p-8 text-center bg-[#e8edf2] rounded-xl border border-dashed border-[#cbd5e1] space-y-2">
                  <GraduationCap className="w-8 h-8 text-[#94a3b8] mx-auto" />
                  <p className="text-sm font-semibold text-[#0f172a]">You haven&apos;t created your tutor profile yet</p>
                  <p className="text-xs text-[#475569] max-w-sm mx-auto">
                    Set up your tutor profile with your subjects, course codes, and availability so students can find and request you.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/tutor/profile"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9c4f65] hover:underline"
                    >
                      Create your tutor profile now
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Account info row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#e8edf2] border border-[#cbd5e1]">
                      <User className="w-4 h-4 text-[#9c4f65]" />
                      <div>
                        <span className="text-[11px] text-[#64748b] block">Full Name</span>
                        <span className="text-sm font-semibold text-[#0f172a]">{user?.name} {user?.surname}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#e8edf2] border border-[#cbd5e1]">
                      <Mail className="w-4 h-4 text-[#9c4f65]" />
                      <div>
                        <span className="text-[11px] text-[#64748b] block">Email</span>
                        <span className="text-sm font-semibold text-[#0f172a]">{user?.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#e8edf2] border border-[#cbd5e1]">
                      <Calendar className="w-4 h-4 text-[#9c4f65]" />
                      <div>
                        <span className="text-[11px] text-[#64748b] block">Member Since</span>
                        <span className="text-sm font-semibold text-[#0f172a]">{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tutorProfile.subjects && (
                      <div className="p-4 rounded-xl bg-[#fce7ec] border border-[#e89aae]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9c4f65] block mb-1">Subjects</span>
                        <p className="text-sm font-medium text-[#0f172a]">{tutorProfile.subjects}</p>
                      </div>
                    )}
                    {tutorProfile.course_codes && (
                      <div className="p-4 rounded-xl bg-[#fce7ec] border border-[#e89aae]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9c4f65] block mb-1">Course Codes</span>
                        <div className="flex flex-wrap gap-1.5">
                          {tutorProfile.course_codes.split(',').map((code, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#f1f4f8] text-[#9c4f65] border border-[#e89aae]">
                              {code.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {tutorProfile.availability && (
                      <div className="p-4 rounded-xl bg-[#fce7ec] border border-[#e89aae]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9c4f65] block mb-1">Availability</span>
                        <p className="text-sm font-medium text-[#0f172a]">{tutorProfile.availability}</p>
                      </div>
                    )}
                    {tutorProfile.qualifications && (
                      <div className="p-4 rounded-xl bg-[#fce7ec] border border-[#e89aae]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9c4f65] block mb-1">Qualifications</span>
                        <p className="text-sm font-medium text-[#0f172a]">{tutorProfile.qualifications}</p>
                      </div>
                    )}
                  </div>

                  {tutorProfile.bio && (
                    <div className="p-4 rounded-xl bg-[#e8edf2] border border-[#cbd5e1]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-1">Bio</span>
                      <p className="text-sm text-[#334155]">{tutorProfile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* My Study Groups Section */}

          <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#cbd5e1] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#9c4f65]" />
                  My Study Groups
                </h2>
                <p className="text-xs text-[#475569] mt-0.5">
                  Groups you&apos;ve created or joined for collaborative learning.
                </p>
              </div>
              <Link
                href="/study-groups/create"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors"
              >
                + Create Group
              </Link>
            </div>

            <div className="p-6">
              {loadingGroups ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#d88299]" />
                </div>
              ) : studyGroups.length === 0 ? (
                <div className="p-8 text-center bg-[#e8edf2] rounded-xl border border-dashed border-[#cbd5e1] space-y-2">
                  <Users className="w-8 h-8 text-[#94a3b8] mx-auto" />
                  <p className="text-sm font-semibold text-[#0f172a]">You haven&apos;t joined any study groups yet</p>
                  <p className="text-xs text-[#475569] max-w-sm mx-auto">
                    Browse available study groups or create your own for collaborative learning.
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <Link
                      href="/study-groups"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9c4f65] hover:underline"
                    >
                      Browse study groups
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href="/study-groups/create"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9c4f65] hover:underline"
                    >
                      Create a group
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studyGroups.slice(0, 4).map((group) => (
                    <Link
                      key={group.id}
                      href={`/study-groups/${group.id}`}
                      className="block p-4 rounded-xl bg-[#e8edf2] border border-[#cbd5e1] hover:border-[#d88299] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae]">
                          {group.course_code}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          group.is_full
                            ? 'bg-[#dce3ec] text-[#64748b] border border-[#cbd5e1]'
                            : 'bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae]'
                        }`}>
                          {group.is_full ? 'Full' : 'Open'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[#0f172a] mb-1.5 line-clamp-1">{group.title}</h3>
                      <div className="space-y-1 text-[11px] text-[#475569]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-[#9c4f65]" />
                          <span className="line-clamp-1">{group.meeting_schedule}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-[#9c4f65]" />
                          <span className="line-clamp-1">{group.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-[#9c4f65]" />
                          <span>{group.member_count} / {group.max_members} members</span>
                        </div>
                      </div>
                      {group.is_creator && (
                        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#9c4f65] bg-[#fce7ec] border border-[#e89aae] px-2 py-0.5 rounded-full">
                          <Shield className="w-2.5 h-2.5" /> Creator
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
              {studyGroups.length > 4 && (
                <div className="mt-4 text-center">
                  <Link
                    href="/study-groups"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9c4f65] hover:underline"
                  >
                    View all {studyGroups.length} study groups
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
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
