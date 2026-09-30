'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  Users,
  MapPin,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  BookOpen,
  Clock,
  Crown,
  UserCheck,
  Lock,
  Settings,
  RefreshCw,
  UserPlus,
  LogOut,
  Trash2,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */

interface GroupMember {
  membership_id: number;
  joined_at: string;
  user_id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  is_creator: boolean;
}

interface GroupCreator {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
}

interface StudyGroupDetail {
  id: number;
  title: string;
  course_code: string;
  description: string | null;
  meeting_schedule: string;
  location: string;
  max_members: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator: GroupCreator;
  members: GroupMember[];
  member_count: number;
  is_full: boolean;
  is_member: boolean;
  is_creator: boolean;
}

/* ─── Constants ───────────────────────────────────────────── */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/* ─── Helpers ─────────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getInitials(name: string, surname: string): string {
  return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
}

function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/* ─── Skeleton loader ─────────────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#e8edf2] animate-pulse">
      <div className="bg-[#f1f4f8] border-b border-[#cbd5e1]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-4 w-32 bg-[#cbd5e1] rounded mb-5" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3 min-w-0 flex-1">
              <div className="h-6 w-24 bg-[#cbd5e1] rounded" />
              <div className="h-8 w-3/4 bg-[#cbd5e1] rounded" />
              <div className="h-4 w-48 bg-[#cbd5e1] rounded" />
            </div>
            <div className="h-8 w-20 bg-[#cbd5e1] rounded-full" />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] p-6 space-y-3">
              <div className="h-5 w-40 bg-[#cbd5e1] rounded" />
              <div className="h-4 w-full bg-[#cbd5e1] rounded" />
              <div className="h-4 w-5/6 bg-[#cbd5e1] rounded" />
            </div>
            <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] p-6 space-y-4">
              <div className="h-5 w-28 bg-[#cbd5e1] rounded" />
              <div className="h-10 w-full bg-[#cbd5e1] rounded" />
              <div className="h-10 w-full bg-[#cbd5e1] rounded" />
            </div>
          </div>
          <div className="space-y-5">
            <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] p-5 space-y-4">
              <div className="h-4 w-24 bg-[#cbd5e1] rounded" />
              <div className="h-2.5 w-full bg-[#cbd5e1] rounded" />
              <div className="h-10 w-full bg-[#cbd5e1] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Confirm modal dialog ────────────────────────────────── */

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClassName?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClassName = 'bg-red-600 hover:bg-red-700 text-white',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-[#f1f4f8] rounded-2xl shadow-2xl border border-[#cbd5e1] max-w-sm w-full p-6 text-[#0f172a]">
        <div className="flex items-start justify-between mb-3">
          <h2 id="confirm-dialog-title" className="text-base font-bold text-white">
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="text-[#475569] hover:text-white transition-colors"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-[#334155] mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${confirmClassName}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */

export default function StudyGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();

  const groupId = params?.id as string;

  const [group, setGroup] = useState<StudyGroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  /* Action states */
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  /* Confirm dialogs */
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  /* ── Fetch group ─────────────────────────────────────────── */

  useEffect(() => {
    let isMounted = true;

    const doFetch = async () => {
      if (!groupId) return;
      setIsLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/api/study-groups/${groupId}`, { headers });

        if (!isMounted) return;

        if (!res.ok) {
          if (res.status === 404) {
            setError('Study group not found.');
          } else {
            const body = await res.json().catch(() => ({}));
            setError((body as { error?: string })?.error || 'Failed to load study group.');
          }
          return;
        }
        const data = await res.json();
        if (isMounted) setGroup(data.study_group);
      } catch {
        if (isMounted) setError('Network error. Please check your connection and try again.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    doFetch();
    return () => { isMounted = false; };
  }, [groupId, token, refreshTrigger]);

  /* ── Join ────────────────────────────────────────────────── */

  const handleJoin = async () => {
    if (!user || !token) {
      router.push(`/login?redirect=/study-groups/${groupId}`);
      return;
    }
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/study-groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const body = await res.json();
      if (!res.ok) {
        const msg = (body as { error?: string })?.error;
        if (res.status === 409) {
          setActionError('You are already a member of this group.');
        } else if (res.status === 400) {
          setActionError(msg || 'This group has reached maximum capacity.');
        } else if (res.status === 401) {
          setActionError('Please log in to join this group.');
        } else {
          setActionError(msg || 'Failed to join study group.');
        }
        return;
      }
      setActionSuccess('You have successfully joined the group!');
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      setActionError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Leave ───────────────────────────────────────────────── */

  const handleLeave = async () => {
    if (!token) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    setShowLeaveConfirm(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/study-groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const body = await res.json();
      if (!res.ok) {
        setActionError((body as { error?: string })?.error || 'Failed to leave study group.');
        return;
      }
      setActionSuccess('You have left the study group.');
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      setActionError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Delete ──────────────────────────────────────────────── */

  const handleDelete = async () => {
    if (!token) return;
    setDeleteLoading(true);
    setShowDeleteConfirm(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/study-groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const body = await res.json();
      if (!res.ok) {
        setActionError((body as { error?: string })?.error || 'Failed to delete study group.');
        setDeleteLoading(false);
        return;
      }
      router.push('/study-groups');
    } catch {
      setActionError('Network error. Please try again.');
      setDeleteLoading(false);
    }
  };

  /* ── Loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return <DetailSkeleton />;
  }

  /* ── Error ───────────────────────────────────────────────── */

  if (error || !group) {
    return (
      <div className="min-h-screen bg-[#e8edf2] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#f1f4f8] rounded-2xl shadow-xl border border-[#cbd5e1] p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-white mb-2">
            {error || 'Study group not found'}
          </h1>
          <p className="text-sm text-[#475569] mb-6">
            The study group you are looking for may have been removed or does not exist.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/study-groups"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Study Groups
            </Link>
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Action area ──────────────────────────────────────────── */

  const renderActionArea = () => {
    if (!user) {
      return (
        <div className="space-y-2">
          <Link
            href={`/login?redirect=/study-groups/${group.id}`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Log in to Join
          </Link>
          <p className="text-[11px] text-[#475569] text-center">
            You need an account to join study groups.
          </p>
        </div>
      );
    }

    if (group.is_creator) {
      return (
        <div className="space-y-2">
          <Link
            href={`/study-groups/${group.id}/edit`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors shadow-md"
          >
            <Settings className="w-4 h-4" />
            Manage Group
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={actionLoading}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Delete this study group"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Group
          </button>
          <p className="text-[11px] text-[#475569] text-center">
            You created this group — you are already a member.
          </p>
        </div>
      );
    }

    if (group.is_member) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-[#d88299] bg-[#fce7ec] border border-[#e89aae]/40">
            <UserCheck className="w-4 h-4" />
            Joined
          </div>
          <button
            onClick={() => setShowLeaveConfirm(true)}
            disabled={actionLoading}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl text-xs font-semibold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Leave this study group"
          >
            {actionLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            Leave Group
          </button>
        </div>
      );
    }

    if (group.is_full) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-[#475569] bg-[#e8edf2] border border-[#cbd5e1] cursor-not-allowed">
            <Lock className="w-4 h-4" />
            Group Full
          </div>
          <p className="text-[11px] text-[#475569] text-center">
            This group has reached its maximum capacity.
          </p>
        </div>
      );
    }

    // Open group — not a member, authenticated
    return (
      <button
        onClick={handleJoin}
        disabled={actionLoading}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        aria-label="Join this study group"
      >
        {actionLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Users className="w-4 h-4" />
        )}
        {actionLoading ? 'Joining…' : 'Join Group'}
      </button>
    );
  };

  /* ── Main render ─────────────────────────────────────────── */

  return (
    <>
      {/* Leave confirm dialog */}
      {showLeaveConfirm && (
        <ConfirmDialog
          title="Leave Study Group?"
          message={`Are you sure you want to leave "${group.title}"? You can rejoin later if the group is still open.`}
          confirmLabel={actionLoading ? 'Leaving…' : 'Yes, Leave'}
          confirmClassName="bg-[#dce3ec] hover:bg-slate-600 text-white"
          isLoading={actionLoading}
          onConfirm={handleLeave}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Study Group?"
          message={`Are you sure you want to permanently delete "${group.title}"? This action cannot be undone. All memberships will be removed.`}
          confirmLabel={deleteLoading ? 'Deleting…' : 'Yes, Delete'}
          confirmClassName="bg-red-600 hover:bg-red-500 text-white"
          isLoading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <div className="min-h-screen bg-[#e8edf2] text-[#0f172a]">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="bg-[#f1f4f8] border-b border-[#cbd5e1]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              href="/study-groups"
              className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#d88299] transition-colors mb-5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Study Groups
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#fce7ec] text-[#d88299] border border-[#9c4f65]/40 mb-3">
                  <BookOpen className="w-3.5 h-3.5" />
                  {group.course_code}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight break-words">
                  {group.title}
                </h1>
                <p className="mt-1.5 text-sm text-[#475569]">
                  Created by{' '}
                  <span className="font-semibold text-[#334155]">
                    {group.creator.name} {group.creator.surname}
                  </span>
                  {' '}· {formatDate(group.created_at)}
                </p>
              </div>
              <div className="shrink-0">
                {group.is_full ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#dce3ec] text-[#475569] border border-[#cbd5e1]">
                    <Lock className="w-4 h-4" />
                    Full
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#fce7ec] text-[#d88299] border border-[#e89aae]/40">
                    <span className="w-2 h-2 rounded-full bg-[#d88299]" />
                    Open
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left column ─────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* About */}
              <section className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-xl p-6" aria-labelledby="section-about">
                <h2 id="section-about" className="text-base font-bold text-white mb-3">
                  About this Group
                </h2>
                {group.description ? (
                  <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
                    {group.description}
                  </p>
                ) : (
                  <p className="text-sm text-[#64748b] italic">No description provided.</p>
                )}
              </section>

              {/* Logistics */}
              <section className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-xl p-6" aria-labelledby="section-logistics">
                <h2 id="section-logistics" className="text-base font-bold text-white mb-4">
                  Logistics
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#fce7ec] border border-[#9c4f65]/40 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-[#d88299]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-0.5">
                        Meeting Schedule
                      </p>
                      <p className="text-sm text-white font-medium">{group.meeting_schedule}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#fce7ec] border border-[#e89aae]/40 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-[#d88299]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-0.5">
                        Location
                      </p>
                      <p className="text-sm text-white font-medium">{group.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#dce3ec] border border-[#cbd5e1] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-[#475569]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-0.5">
                        Last Updated
                      </p>
                      <p className="text-sm text-white font-medium">{formatDate(group.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Members */}
              <section className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-xl p-6" aria-labelledby="section-members">
                <h2 id="section-members" className="text-base font-bold text-white mb-4">
                  Members
                  <span className="ml-2 text-sm font-semibold text-[#475569]">
                    ({group.member_count}/{group.max_members})
                  </span>
                </h2>

                {!group.members || group.members.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#dce3ec] border border-[#cbd5e1] flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#475569]" />
                    </div>
                    <p className="text-sm font-medium text-[#334155]">No members yet</p>
                    <p className="text-xs text-[#475569] max-w-xs">
                      Be the first to join this study group!
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#cbd5e1] max-h-96 overflow-y-auto" aria-label="Study group members">
                    {group.members.map((member) => (
                      <li
                        key={member.membership_id}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            member.is_creator
                              ? 'bg-[#fce7ec] border border-[#9c4f65]/60 text-[#d88299]'
                              : 'bg-[#dce3ec] border border-[#cbd5e1] text-[#334155]'
                          }`}
                          aria-hidden="true"
                        >
                          {getInitials(member.name, member.surname)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">
                            {member.name} {member.surname}
                            {member.is_creator && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-[#d88299]">
                                <Crown className="w-3 h-3" />
                                Creator
                              </span>
                            )}
                            {user && member.user_id === user.id && !member.is_creator && (
                              <span className="ml-1.5 text-[10px] font-semibold text-[#d88299]">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-[#475569] truncate">
                            {roleLabel(member.role)} · Joined {formatDate(member.joined_at)}
                          </p>
                        </div>
                        <span
                          className={`hidden sm:inline-flex shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            member.role === 'tutor'
                              ? 'bg-[#fce7ec] text-[#d88299] border-[#e89aae]/40'
                              : 'bg-[#dce3ec] text-[#475569] border-[#cbd5e1]'
                          }`}
                        >
                          {roleLabel(member.role)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* ── Right column: sidebar ────────────────────────── */}
            <div className="space-y-5">

              {/* Action card */}
              <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-xl p-5 sticky top-6">
                {/* Capacity bar */}
                <div className="mb-5">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-[#475569]">Capacity</span>
                    <span className="font-bold text-white">
                      {group.member_count} / {group.max_members} members
                    </span>
                  </div>
                  <div
                    className="w-full h-2.5 rounded-full bg-[#e8edf2] border border-[#cbd5e1] overflow-hidden"
                    role="progressbar"
                    aria-valuenow={group.member_count}
                    aria-valuemin={0}
                    aria-valuemax={group.max_members}
                    aria-label={`${group.member_count} of ${group.max_members} members`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        group.is_full ? 'bg-slate-500' : 'bg-[#d88299]'
                      }`}
                      style={{ width: `${Math.min(100, Math.round((group.member_count / group.max_members) * 100))}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#475569] mt-1">
                    {group.is_full
                      ? 'This group is full.'
                      : `${group.max_members - group.member_count} spot${
                          group.max_members - group.member_count !== 1 ? 's' : ''
                        } remaining`}
                  </p>
                </div>

                {/* Feedback messages */}
                {actionError && (
                  <div role="alert" className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{actionError}</span>
                  </div>
                )}
                {actionSuccess && (
                  <div role="status" className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-[#fce7ec] border border-[#e89aae] text-xs text-[#9c4f65]">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#9c4f65]" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {renderActionArea()}
              </div>

              {/* Creator card */}
              <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-xl p-5">
                <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wide mb-3">
                  Group Creator
                </h3>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full bg-[#fce7ec] border border-[#9c4f65]/60 text-[#d88299] flex items-center justify-center text-sm font-bold shrink-0"
                    aria-hidden="true"
                  >
                    {getInitials(group.creator.name, group.creator.surname)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {group.creator.name} {group.creator.surname}
                    </p>
                    <p className="text-xs text-[#475569] capitalize">
                      {roleLabel(group.creator.role)}
                    </p>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-[#d88299] shrink-0 ml-auto" aria-hidden="true" />
                </div>
              </div>

              {/* Quick stats card */}
              <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-xl p-5">
                <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wide mb-3">
                  Group Stats
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-[#475569]">Course</dt>
                    <dd className="font-semibold text-white">{group.course_code}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-[#475569]">Members</dt>
                    <dd className="font-semibold text-white">
                      {group.member_count} / {group.max_members}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-[#475569]">Status</dt>
                    <dd className={`font-semibold ${group.is_full ? 'text-[#475569]' : 'text-[#d88299]'}`}>
                      {group.is_full ? 'Full' : 'Open'}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-[#475569]">Created</dt>
                    <dd className="font-semibold text-white">{formatDate(group.created_at)}</dd>
                  </div>
                </dl>
              </div>

              {/* Refresh */}
              <button
                onClick={() => setRefreshTrigger((prev) => prev + 1)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#334155] bg-[#dce3ec] border border-[#cbd5e1] hover:bg-[#cbd5e1] transition-colors"
                aria-label="Refresh study group data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
