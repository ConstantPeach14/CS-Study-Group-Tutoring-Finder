'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  BookOpen,
  GraduationCap,
  Users,
  CheckCircle2,
  ArrowLeft,
  MapPin,
  Clock,
  PlusCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface ModuleDetail {
  id: number;
  code: string;
  name: string;
  faculty: string;
  description: string | null;
  student_count: number;
  tutor_count: number;
  group_count: number;
  is_enrolled?: boolean;
  user_role?: string | null;
}

interface StudyGroup {
  id: number;
  title: string;
  course_code: string;
  description: string | null;
  location: string;
  meeting_schedule: string;
  max_members: number;
  created_at: string;
  creator_name: string;
  creator_surname: string;
  member_count: number;
  is_full: boolean;
}

interface Tutor {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  bio: string | null;
  subjects: string;
  course_codes: string;
  qualifications: string | null;
  availability: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ModuleDetailPage() {
  const params = useParams();
  const { user, token } = useAuth();
  const moduleId = params?.id as string;

  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'groups' | 'tutors'>('groups');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!moduleId) return;
    let isMounted = true;

    const fetchModuleDetails = async () => {
      try {
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE_URL}/api/modules/${moduleId}`, { headers });
        if (res.ok && isMounted) {
          const data = await res.json();
          setModule(data.module);
          setStudyGroups(data.study_groups || []);
          setTutors(data.tutors || []);
        } else if (isMounted) {
          setFeedback({ type: 'error', text: 'Module not found.' });
        }
      } catch (err) {
        console.error('Error fetching module details:', err);
        if (isMounted) {
          setFeedback({ type: 'error', text: 'Failed to load module details.' });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchModuleDetails();
    return () => {
      isMounted = false;
    };
  }, [moduleId, token]);


  // Handle student enrollment
  const handleEnroll = async () => {
    if (!token || !module) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/modules/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ module_id: module.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', text: `Enrolled successfully in ${module.code}!` });
        setModule((prev) =>
          prev ? { ...prev, is_enrolled: true, student_count: prev.student_count + 1 } : null
        );
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to enroll.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error enrolling in module.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle student unenrollment
  const handleUnenroll = async () => {
    if (!token || !module) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/modules/unenroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ module_id: module.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', text: `Unenrolled from ${module.code}.` });
        setModule((prev) =>
          prev
            ? { ...prev, is_enrolled: false, student_count: Math.max(0, prev.student_count - 1) }
            : null
        );
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to unenroll.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error unenrolling from module.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle tutor qualification registration
  const handleTutorRegister = async () => {
    if (!token || !module) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tutors/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ module_id: module.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          text: `Added ${module.code} to your verified tutoring modules!`,
        });
        setModule((prev) =>
          prev ? { ...prev, is_enrolled: true, tutor_count: prev.tutor_count + 1 } : null
        );
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to register module.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error registering tutor module.' });
    } finally {
      setActionLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#e8edf2] py-16 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-10 h-10 text-[#9c4f65] animate-spin mb-4" />
        <h2 className="text-lg font-bold text-[#0f172a]">Loading module details...</h2>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-[#e8edf2] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <AlertCircle className="w-12 h-12 text-[#9c4f65] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0f172a]">Module Not Found</h2>
          <p className="mt-2 text-sm text-[#334155]">
            The requested course module does not exist or may have been removed.
          </p>
          <Link
            href="/modules"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8edf2] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/modules"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#9c4f65] hover:text-[#c46982] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course Directory
          </Link>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-sm font-semibold ${
              feedback.type === 'success'
                ? 'bg-[#fce7ec] border-[#e89aae] text-[#9c4f65]'
                : 'bg-red-50 border-red-300 text-red-800'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs uppercase font-bold tracking-wider hover:opacity-75 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Module Header Card */}
        <div className="bg-[#f1f4f8] border border-[#cbd5e1] rounded-2xl p-6 sm:p-8 mb-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3.5 py-1.5 rounded-xl text-base font-extrabold bg-[#fce7ec] border border-[#e89aae] text-[#9c4f65]">
                  {module.code}
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#dce3ec] text-[#334155]">
                  {module.faculty}
                </span>
                {module.is_enrolled && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#fce7ec] border border-[#e89aae] text-[#9c4f65]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {user?.role === 'tutor' ? 'Teaching Qualified' : 'Currently Enrolled'}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                {module.name}
              </h1>

              <p className="text-sm sm:text-base text-[#334155] leading-relaxed">
                {module.description || 'No module description provided.'}
              </p>

              {/* Stats Summary */}
              <div className="pt-2 flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-[#334155]">
                  <Users className="w-4 h-4 text-[#9c4f65]" />
                  <span className="font-bold text-[#0f172a]">{module.student_count}</span> Enrolled Students
                </div>
                <div className="flex items-center gap-2 text-[#334155]">
                  <GraduationCap className="w-4 h-4 text-[#9c4f65]" />
                  <span className="font-bold text-[#0f172a]">{module.tutor_count}</span> Available Tutors
                </div>
                <div className="flex items-center gap-2 text-[#334155]">
                  <BookOpen className="w-4 h-4 text-[#9c4f65]" />
                  <span className="font-bold text-[#0f172a]">{module.group_count}</span> Study Groups
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              {user?.role === 'student' && (
                <>
                  {module.is_enrolled ? (
                    <button
                      onClick={handleUnenroll}
                      disabled={actionLoading}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unenroll from Course'}
                    </button>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={actionLoading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] border border-[#d47b93] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enroll in this Module'}
                    </button>
                  )}

                  <Link
                    href={`/study-groups/create?course_code=${encodeURIComponent(module.code)}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#1e293b] bg-[#fce7ec] hover:bg-[#f8d7df] border border-[#e89aae] transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-[#9c4f65]" />
                    Create Study Group
                  </Link>
                </>
              )}

              {user?.role === 'tutor' && (
                <>
                  {!module.is_enrolled ? (
                    <button
                      onClick={handleTutorRegister}
                      disabled={actionLoading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] border border-[#d47b93] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to My Teaching List'}
                    </button>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-[#fce7ec] border border-[#e89aae] text-[#9c4f65]">
                      <CheckCircle2 className="w-4 h-4" />
                      Teaching Certified
                    </span>
                  )}
                  <Link
                    href={`/study-groups/create?course_code=${encodeURIComponent(module.code)}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#1e293b] bg-[#fce7ec] hover:bg-[#f8d7df] border border-[#e89aae] transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-[#9c4f65]" />
                    Host Study Group
                  </Link>
                </>
              )}

              {!user && (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] transition-colors"
                >
                  Sign In to Enroll
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-[#cbd5e1] mb-6">
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'groups'
                ? 'border-[#d88299] text-[#9c4f65] bg-[#f1f4f8] rounded-t-xl'
                : 'border-transparent text-[#334155] hover:text-[#9c4f65]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Active Study Groups ({studyGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('tutors')}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'tutors'
                ? 'border-[#d88299] text-[#9c4f65] bg-[#f1f4f8] rounded-t-xl'
                : 'border-transparent text-[#334155] hover:text-[#9c4f65]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Peer Tutors ({tutors.length})
          </button>
        </div>

        {/* Tab 1: Study Groups Content */}
        {activeTab === 'groups' && (
          <div>
            {studyGroups.length === 0 ? (
              <div className="bg-[#f1f4f8] border border-[#cbd5e1] rounded-2xl p-12 text-center">
                <BookOpen className="w-12 h-12 text-[#9c4f65] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[#0f172a]">No study groups yet for {module.code}</h3>
                <p className="mt-1 text-sm text-[#334155] max-w-md mx-auto">
                  Be the first student to start a collaborative study session for this course.
                </p>
                {user ? (
                  <Link
                    href={`/study-groups/create?course_code=${encodeURIComponent(module.code)}`}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create Study Group for {module.code}
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] transition-colors"
                  >
                    Sign In to Create Group
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studyGroups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-[#f1f4f8] border border-[#cbd5e1] rounded-2xl p-6 flex flex-col justify-between hover:border-[#d88299] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#fce7ec] border border-[#e89aae] text-[#9c4f65]">
                          {group.course_code}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            group.is_full
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae]'
                          }`}
                        >
                          {group.member_count} / {group.max_members} Members
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-[#0f172a] mb-2">{group.title}</h4>
                      <p className="text-xs text-[#334155] line-clamp-2 mb-4">
                        {group.description || 'No description provided.'}
                      </p>

                      <div className="space-y-1.5 text-xs text-[#334155] pt-2 border-t border-[#cbd5e1]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#9c4f65]" />
                          <span>{group.meeting_schedule}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#9c4f65]" />
                          <span className="truncate">{group.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-[#9c4f65]" />
                          <span>Host: {group.creator_name} {group.creator_surname}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#cbd5e1] flex items-center justify-between">
                      <Link
                        href={`/study-groups/${group.id}`}
                        className="text-xs font-bold text-[#9c4f65] hover:text-[#c46982] inline-flex items-center gap-1"
                      >
                        View Details
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Tutors Content */}
        {activeTab === 'tutors' && (
          <div>
            {tutors.length === 0 ? (
              <div className="bg-[#f1f4f8] border border-[#cbd5e1] rounded-2xl p-12 text-center">
                <GraduationCap className="w-12 h-12 text-[#9c4f65] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[#0f172a]">No tutors listed for {module.code} yet</h3>
                <p className="mt-1 text-sm text-[#334155] max-w-md mx-auto">
                  Are you an advanced student or teaching assistant? Add this module to your tutor profile.
                </p>
                {user?.role === 'tutor' ? (
                  <button
                    onClick={handleTutorRegister}
                    disabled={actionLoading}
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Teach ${module.code}`}
                  </button>
                ) : (
                  <Link
                    href="/tutors"
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] transition-colors"
                  >
                    Explore All Tutors
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tutors.map((tutor) => (
                  <div
                    key={tutor.id}
                    className="bg-[#f1f4f8] border border-[#cbd5e1] rounded-2xl p-6 flex flex-col justify-between hover:border-[#d88299] transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-[#fce7ec] border border-[#e89aae] flex items-center justify-center text-[#9c4f65] font-extrabold text-base">
                          {tutor.name.charAt(0)}{tutor.surname.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-[#0f172a]">
                            {tutor.name} {tutor.surname}
                          </h4>
                          <span className="text-[11px] font-semibold text-[#9c4f65] uppercase tracking-wider">
                            Verified Peer Tutor
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#334155] line-clamp-3 mb-3">
                        {tutor.bio || 'No tutor biography provided.'}
                      </p>

                      <div className="space-y-1.5 text-xs text-[#334155] pt-2 border-t border-[#cbd5e1]">
                        <div>
                          <span className="font-bold text-[#64748b]">Availability: </span>
                          <span>{tutor.availability}</span>
                        </div>
                        {tutor.qualifications && (
                          <div>
                            <span className="font-bold text-[#64748b]">Credentials: </span>
                            <span className="truncate">{tutor.qualifications}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#cbd5e1] flex items-center justify-between">
                      <Link
                        href={`/tutors/${tutor.id}`}
                        className="text-xs font-bold text-[#9c4f65] hover:text-[#c46982] inline-flex items-center gap-1"
                      >
                        View Profile
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      {user?.role === 'student' && (
                        <Link
                          href={`/tutors/${tutor.id}?request=true&course=${encodeURIComponent(module.code)}`}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] border border-[#d47b93] transition-colors"
                        >
                          Request Tutoring
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
