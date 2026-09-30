'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import {
  ArrowLeft,
  BookOpen,
  Users,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldOff,
  Info,
} from 'lucide-react';

/* ─── Constants ───────────────────────────────────────────── */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const MAX_TITLE_LEN = 150;
const MAX_COURSE_LEN = 50;
const MAX_SCHEDULE_LEN = 255;
const MAX_LOCATION_LEN = 255;
const MAX_DESC_LEN = 1000;
const MIN_MEMBERS = 2;
const MAX_MEMBERS = 50;

/* ─── Types ───────────────────────────────────────────────── */

interface FormFields {
  title: string;
  course_code: string;
  description: string;
  meeting_schedule: string;
  location: string;
  max_members: string;
}

interface FormErrors {
  title?: string;
  course_code?: string;
  description?: string;
  meeting_schedule?: string;
  location?: string;
  max_members?: string;
}

interface GroupSummary {
  id: number;
  title: string;
  course_code: string;
  description: string | null;
  meeting_schedule: string;
  location: string;
  max_members: number;
  created_by: number;
  member_count: number;
  is_creator: boolean;
}

/* ─── Helpers ─────────────────────────────────────────────── */

function validateForm(fields: FormFields, minMembers: number): FormErrors {
  const errors: FormErrors = {};

  const title = fields.title.trim();
  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  } else if (title.length > MAX_TITLE_LEN) {
    errors.title = `Title cannot exceed ${MAX_TITLE_LEN} characters.`;
  }

  const code = fields.course_code.trim();
  if (!code) {
    errors.course_code = 'Course code is required (e.g., CSC101).';
  } else if (code.length < 2) {
    errors.course_code = 'Course code must be at least 2 characters.';
  } else if (code.length > MAX_COURSE_LEN) {
    errors.course_code = `Course code cannot exceed ${MAX_COURSE_LEN} characters.`;
  }

  const schedule = fields.meeting_schedule.trim();
  if (!schedule) {
    errors.meeting_schedule = 'Meeting schedule is required.';
  } else if (schedule.length > MAX_SCHEDULE_LEN) {
    errors.meeting_schedule = `Meeting schedule cannot exceed ${MAX_SCHEDULE_LEN} characters.`;
  }

  const loc = fields.location.trim();
  if (!loc) {
    errors.location = 'Location is required.';
  } else if (loc.length > MAX_LOCATION_LEN) {
    errors.location = `Location cannot exceed ${MAX_LOCATION_LEN} characters.`;
  }

  if (fields.description.trim().length > MAX_DESC_LEN) {
    errors.description = `Description cannot exceed ${MAX_DESC_LEN} characters.`;
  }

  const maxMem = parseInt(fields.max_members, 10);
  if (!fields.max_members || isNaN(maxMem)) {
    errors.max_members = 'Maximum members is required.';
  } else if (maxMem < minMembers) {
    errors.max_members = `Cannot be less than the current number of members (${minMembers}).`;
  } else if (maxMem > MAX_MEMBERS) {
    errors.max_members = `Cannot exceed ${MAX_MEMBERS} members.`;
  }

  return errors;
}

/* ─── Sub-component: Character counter ────────────────────── */

function CharCount({ value, max }: { value: string; max: number }) {
  const count = value.length;
  const isNear = count >= max * 0.85;
  const isAt = count >= max;
  return (
    <span
      className={`text-xs ${
        isAt
          ? 'text-red-400 font-semibold'
          : isNear
          ? 'text-amber-400'
          : 'text-[#64748b]'
      }`}
      aria-live="polite"
    >
      {count}/{max}
    </span>
  );
}

/* ─── Page ────────────────────────────────────────────────── */

export default function EditStudyGroupPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  const groupId = params?.id as string;

  const [group, setGroup] = useState<GroupSummary | null>(null);
  const [loadingGroup, setLoadingGroup] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fields, setFields] = useState<FormFields>({
    title: '',
    course_code: '',
    description: '',
    meeting_schedule: '',
    location: '',
    max_members: '10',
  });

  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /* ── Auth guard ──────────────────────────────────────────── */
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/study-groups/${groupId}/edit`);
    }
  }, [authLoading, user, router, groupId]);

  /* ── Fetch existing group data ────────────────────────────── */
  useEffect(() => {
    let isMounted = true;

    const fetchGroup = async () => {
      if (!groupId) return;
      setLoadingGroup(true);
      setLoadError(null);

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/api/study-groups/${groupId}`, { headers });
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok) {
          if (res.status === 404) {
            setLoadError('Study group not found.');
          } else {
            setLoadError((data as { error?: string })?.error || 'Failed to load study group.');
          }
          return;
        }

        const g = data.study_group;
        setGroup(g);
        setFields({
          title: g.title || '',
          course_code: g.course_code || '',
          description: g.description || '',
          meeting_schedule: g.meeting_schedule || '',
          location: g.location || '',
          max_members: String(g.max_members || 10),
        });
      } catch {
        if (isMounted) setLoadError('Network error. Please check your connection.');
      } finally {
        if (isMounted) setLoadingGroup(false);
      }
    };

    fetchGroup();
    return () => { isMounted = false; };
  }, [groupId, token]);

  /* ── Field change handler ─────────────────────────────────── */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const minMem = group?.member_count ?? MIN_MEMBERS;
      const errs = validateForm({ ...fields, [name]: value }, minMem);
      setFieldErrors((prev) => ({ ...prev, [name]: errs[name as keyof FormErrors] }));
    }
  };

  /* ── Field blur handler ───────────────────────────────────── */
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const minMem = group?.member_count ?? MIN_MEMBERS;
    const errs = validateForm(fields, minMem);
    setFieldErrors((prev) => ({ ...prev, [name]: errs[name as keyof FormErrors] }));
  };

  /* ── Form submit handler ──────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allTouched: Record<string, boolean> = {
      title: true,
      course_code: true,
      description: true,
      meeting_schedule: true,
      location: true,
      max_members: true,
    };
    setTouched(allTouched);

    const minMem = group?.member_count ?? MIN_MEMBERS;
    const errs = validateForm(fields, minMem);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!user || !token) {
      router.push(`/login?redirect=/study-groups/${groupId}/edit`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/study-groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: fields.title.trim(),
          course_code: fields.course_code.trim(),
          description: fields.description.trim() || null,
          meeting_schedule: fields.meeting_schedule.trim(),
          location: fields.location.trim(),
          max_members: parseInt(fields.max_members, 10),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setSubmitError('You are not authorised to edit this study group.');
        } else {
          setSubmitError(
            (data as { error?: string })?.error || 'Failed to update study group. Please try again.'
          );
        }
        return;
      }

      setSubmitSuccess('Study group updated successfully. Redirecting…');
      setTimeout(() => {
        router.push(`/study-groups/${groupId}`);
      }, 1200);
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Loading states ───────────────────────────────────────── */

  if (authLoading || loadingGroup) {
    return (
      <div className="min-h-screen bg-[#e8edf2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#475569]">
          <Loader2 className="w-8 h-8 animate-spin text-[#d88299]" />
          <p className="text-sm font-medium">Loading study group…</p>
        </div>
      </div>
    );
  }

  /* ── Load error ───────────────────────────────────────────── */

  if (loadError || !group) {
    return (
      <div className="min-h-screen bg-[#e8edf2] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#f1f4f8] rounded-2xl shadow-xl border border-[#cbd5e1] p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-white mb-2">
            {loadError || 'Study group not found'}
          </h1>
          <p className="text-sm text-[#475569] mb-6">
            The study group could not be loaded. It may not exist or there was a connection issue.
          </p>
          <Link
            href="/study-groups"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Study Groups
          </Link>
        </div>
      </div>
    );
  }

  /* ── Access denied (not creator) ─────────────────────────── */

  if (!group.is_creator) {
    return (
      <div className="min-h-screen bg-[#e8edf2] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#f1f4f8] rounded-2xl shadow-xl border border-[#cbd5e1] p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-lg font-bold text-white mb-2">Access Denied</h1>
          <p className="text-sm text-[#475569] mb-6">
            Only the creator of this study group can edit it.
          </p>
          <Link
            href={`/study-groups/${groupId}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Group
          </Link>
        </div>
      </div>
    );
  }

  const minMembersAllowed = group.member_count;

  /* ── Render form ──────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-[#e8edf2] text-[#0f172a]">
      {/* Page Header */}
      <div className="bg-[#f1f4f8] border-b border-[#cbd5e1]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/study-groups/${groupId}`}
            className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#d88299] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Group
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            Edit Study Group
          </h1>
          <p className="mt-1.5 text-sm text-[#475569]">
            Update the details for{' '}
            <span className="font-semibold text-[#334155]">{group.title}</span>.
          </p>
        </div>
      </div>

      {/* Form Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} noValidate aria-label="Edit study group form">
          <div className="space-y-6">

            {/* Success */}
            {submitSuccess && (
              <div role="status" className="flex items-start gap-3 p-4 rounded-xl bg-[#fce7ec] border border-[#e89aae] text-sm text-[#9c4f65]">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#9c4f65]" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {/* Submit-level error */}
            {submitError && (
              <div role="alert" className="flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-sm text-red-300">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Card: Basic Info */}
            <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-xl p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-[#d88299]" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  Basic Information
                </h2>
              </div>

              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="title" className="block text-sm font-semibold text-[#334155]">
                    Group Title <span className="text-[#d88299]">*</span>
                  </label>
                  <CharCount value={fields.title} max={MAX_TITLE_LEN} />
                </div>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={fields.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={MAX_TITLE_LEN}
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.title}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.title
                      ? 'border-red-500/80 bg-red-950/30 text-white'
                      : 'border-[#cbd5e1] bg-[#e8edf2] text-white placeholder:text-[#64748b]'
                  }`}
                />
                {fieldErrors.title && (
                  <p role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              {/* Course Code */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="course_code" className="block text-sm font-semibold text-[#334155]">
                    Course Code <span className="text-[#d88299]">*</span>
                  </label>
                  <CharCount value={fields.course_code} max={MAX_COURSE_LEN} />
                </div>
                <input
                  id="course_code"
                  name="course_code"
                  type="text"
                  value={fields.course_code}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={MAX_COURSE_LEN}
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.course_code}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.course_code
                      ? 'border-red-500/80 bg-red-950/30 text-white'
                      : 'border-[#cbd5e1] bg-[#e8edf2] text-white placeholder:text-[#64748b]'
                  }`}
                />
                {fieldErrors.course_code && (
                  <p role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {fieldErrors.course_code}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="description" className="block text-sm font-semibold text-[#334155]">
                    Description{' '}
                    <span className="text-[#64748b] font-normal text-xs">(optional)</span>
                  </label>
                  <CharCount value={fields.description} max={MAX_DESC_LEN} />
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={fields.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={MAX_DESC_LEN}
                  rows={4}
                  disabled={isSubmitting}
                  aria-invalid={!!fieldErrors.description}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] resize-y disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.description
                      ? 'border-red-500/80 bg-red-950/30 text-white'
                      : 'border-[#cbd5e1] bg-[#e8edf2] text-white placeholder:text-[#64748b]'
                  }`}
                />
                {fieldErrors.description && (
                  <p role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {fieldErrors.description}
                  </p>
                )}
              </div>
            </div>

            {/* Card: Logistics */}
            <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-xl p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-[#d88299]" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  Logistics
                </h2>
              </div>

              {/* Meeting Schedule */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="meeting_schedule" className="block text-sm font-semibold text-[#334155]">
                    Meeting Schedule <span className="text-[#d88299]">*</span>
                  </label>
                  <CharCount value={fields.meeting_schedule} max={MAX_SCHEDULE_LEN} />
                </div>
                <input
                  id="meeting_schedule"
                  name="meeting_schedule"
                  type="text"
                  value={fields.meeting_schedule}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={MAX_SCHEDULE_LEN}
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.meeting_schedule}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.meeting_schedule
                      ? 'border-red-500/80 bg-red-950/30 text-white'
                      : 'border-[#cbd5e1] bg-[#e8edf2] text-white placeholder:text-[#64748b]'
                  }`}
                />
                {fieldErrors.meeting_schedule && (
                  <p role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {fieldErrors.meeting_schedule}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="location" className="block text-sm font-semibold text-[#334155]">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#d88299]" />
                      Meeting Location <span className="text-[#d88299]">*</span>
                    </span>
                  </label>
                  <CharCount value={fields.location} max={MAX_LOCATION_LEN} />
                </div>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={fields.location}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  maxLength={MAX_LOCATION_LEN}
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.location}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.location
                      ? 'border-red-500/80 bg-red-950/30 text-white'
                      : 'border-[#cbd5e1] bg-[#e8edf2] text-white placeholder:text-[#64748b]'
                  }`}
                />
                {fieldErrors.location && (
                  <p role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {fieldErrors.location}
                  </p>
                )}
              </div>
            </div>

            {/* Card: Capacity */}
            <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-[#d88299]" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  Capacity
                </h2>
              </div>
              <label htmlFor="max_members" className="block text-sm font-semibold text-[#334155] mb-1.5">
                Maximum Members <span className="text-[#d88299]">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="max_members"
                  name="max_members"
                  type="number"
                  min={minMembersAllowed}
                  max={MAX_MEMBERS}
                  value={fields.max_members}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.max_members}
                  className={`w-32 px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.max_members
                      ? 'border-red-500/80 bg-red-950/30 text-white'
                      : 'border-[#cbd5e1] bg-[#e8edf2] text-white'
                  }`}
                />
                <span className="text-sm text-[#475569]">
                  members (current: {group.member_count})
                </span>
              </div>
              {fieldErrors.max_members && (
                <p role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {fieldErrors.max_members}
                </p>
              )}
              <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-[#dce3ec] border border-[#cbd5e1] text-xs text-[#475569]">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#d88299]" />
                <span>
                  Minimum allowed is {minMembersAllowed} — the current number of enrolled members.
                  You cannot reduce capacity below the current membership.
                </span>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Link
                href={`/study-groups/${groupId}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#334155] bg-[#dce3ec] border border-[#cbd5e1] hover:bg-[#cbd5e1] transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !!submitSuccess}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Save changes"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
