'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  ArrowLeft,
  BookOpen,
  Users,
  MapPin,
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
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

/* ─── Helpers ─────────────────────────────────────────────── */

function validateForm(fields: FormFields): FormErrors {
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
  } else if (maxMem < MIN_MEMBERS || maxMem > MAX_MEMBERS) {
    errors.max_members = `Must be between ${MIN_MEMBERS} and ${MAX_MEMBERS}.`;
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

export default function CreateStudyGroupPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /* ── Route guard ─────────────────────────────────────────── */
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/study-groups/create');
    }
  }, [authLoading, user, router]);

  /* ── Field change handler ─────────────────────────────────── */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));

    // Clear field-level error once user starts correcting
    if (touched[name]) {
      const errs = validateForm({ ...fields, [name]: value });
      setFieldErrors((prev) => ({ ...prev, [name]: errs[name as keyof FormErrors] }));
    }
  };

  /* ── Field blur handler ───────────────────────────────────── */
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errs = validateForm(fields);
    setFieldErrors((prev) => ({ ...prev, [name]: errs[name as keyof FormErrors] }));
  };

  /* ── Form submit handler ──────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Mark all as touched
    const allTouched: Record<string, boolean> = {
      title: true,
      course_code: true,
      description: true,
      meeting_schedule: true,
      location: true,
      max_members: true,
    };
    setTouched(allTouched);

    const errors = validateForm(fields);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (!token) {
      setSubmitError('Authentication session expired. Please log in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: fields.title.trim(),
        course_code: fields.course_code.trim().toUpperCase(),
        description: fields.description.trim() || null,
        meeting_schedule: fields.meeting_schedule.trim(),
        location: fields.location.trim(),
        max_members: parseInt(fields.max_members, 10),
      };

      const res = await fetch(`${API_BASE_URL}/api/study-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login?redirect=/study-groups/create');
          return;
        }
        setSubmitError(
          (data as { error?: string })?.error || 'Failed to create study group. Please try again.'
        );
        return;
      }

      // Success — redirect to the new group's detail page
      const newId = (data as { study_group?: { id?: number } }).study_group?.id;
      if (newId) {
        router.push(`/study-groups/${newId}`);
      } else {
        router.push('/study-groups');
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Auth loading / redirect guard ───────────────────────── */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#e8edf2] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d88299]" />
      </div>
    );
  }
  if (!user) return null; // will redirect

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#e8edf2] text-[#0f172a]">
      {/* Page Header */}
      <div className="bg-[#f1f4f8] border-b border-[#cbd5e1]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/study-groups"
            className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#d88299] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Study Groups
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            Create a Study Group
          </h1>
          <p className="mt-1.5 text-sm text-[#475569]">
            Fill in the details below to create a new study group. You will automatically become
            the first member and creator.
          </p>
        </div>
      </div>

      {/* Form Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} noValidate aria-label="Create study group form">
          <div className="space-y-6">

            {/* Submit-level error */}
            {submitError && (
              <div
                role="alert"
                className="flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-sm text-red-300"
              >
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
                <label htmlFor="title" className="block text-sm font-semibold text-[#334155] mb-1.5">
                  Group Title <span className="text-[#d88299]">*</span>
                </label>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#475569]">What is your group studying?</span>
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
                  placeholder="e.g., Data Structures Study Group"
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.title}
                  aria-describedby={fieldErrors.title ? 'title-error' : undefined}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.title
                      ? 'border-red-500/80 bg-red-950/30 text-white'
                      : 'border-[#cbd5e1] bg-[#e8edf2] text-white placeholder:text-[#64748b]'
                  }`}
                />
                {fieldErrors.title && (
                  <p id="title-error" role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              {/* Course Code */}
              <div>
                <label htmlFor="course_code" className="block text-sm font-semibold text-[#334155] mb-1.5">
                  Course Code <span className="text-[#d88299]">*</span>
                </label>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#475569]">Module or course identifier</span>
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
                  placeholder="e.g., CSC2001F, MATH101"
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.course_code}
                  aria-describedby={fieldErrors.course_code ? 'course-error' : undefined}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.course_code
                      ? 'border-red-500/80 bg-red-950/30 text-white'
                      : 'border-[#cbd5e1] bg-[#e8edf2] text-white placeholder:text-[#64748b]'
                  }`}
                />
                {fieldErrors.course_code && (
                  <p id="course-error" role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {fieldErrors.course_code}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-[#334155] mb-1.5">
                  Description{' '}
                  <span className="text-[#64748b] font-normal text-xs">(optional)</span>
                </label>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#475569]">What topics will you cover?</span>
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
                  placeholder="Describe your study group's goals, topics, and approach…"
                  disabled={isSubmitting}
                  aria-invalid={!!fieldErrors.description}
                  aria-describedby={fieldErrors.description ? 'desc-error' : undefined}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] resize-y disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.description
                      ? 'border-red-500/80 bg-red-950/30 text-white'
                      : 'border-[#cbd5e1] bg-[#e8edf2] text-white placeholder:text-[#64748b]'
                  }`}
                />
                {fieldErrors.description && (
                  <p id="desc-error" role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
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
                <label htmlFor="meeting_schedule" className="block text-sm font-semibold text-[#334155] mb-1.5">
                  Meeting Schedule <span className="text-[#d88299]">*</span>
                </label>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#475569]">When and how often do you meet?</span>
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
                  placeholder="e.g., Tuesdays & Thursdays, 18:00–20:00"
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.meeting_schedule}
                  aria-describedby={fieldErrors.meeting_schedule ? 'schedule-error' : undefined}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.meeting_schedule
                      ? 'border-red-500/80 bg-red-950/30 text-white'
                      : 'border-[#cbd5e1] bg-[#e8edf2] text-white placeholder:text-[#64748b]'
                  }`}
                />
                {fieldErrors.meeting_schedule && (
                  <p id="schedule-error" role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {fieldErrors.meeting_schedule}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-[#334155] mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#d88299]" />
                    Meeting Location <span className="text-[#d88299]">*</span>
                  </span>
                </label>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#475569]">Campus venue or virtual link</span>
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
                  placeholder="e.g., Library Room 204 or https://meet.google.com/…"
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.location}
                  aria-describedby={fieldErrors.location ? 'location-error' : undefined}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.location
                      ? 'border-red-500/80 bg-red-950/30 text-white'
                      : 'border-[#cbd5e1] bg-[#e8edf2] text-white placeholder:text-[#64748b]'
                  }`}
                />
                {fieldErrors.location && (
                  <p id="location-error" role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
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
                  min={MIN_MEMBERS}
                  max={MAX_MEMBERS}
                  value={fields.max_members}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.max_members}
                  aria-describedby="max-members-hint max-members-error"
                  className={`w-32 px-3.5 py-2.5 text-sm rounded-xl border transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.max_members
                      ? 'border-red-500/80 bg-red-950/30 text-white'
                      : 'border-[#cbd5e1] bg-[#e8edf2] text-white'
                  }`}
                />
                <span id="max-members-hint" className="text-sm text-[#475569]">
                  members (incl. you as creator)
                </span>
              </div>
              {fieldErrors.max_members && (
                <p id="max-members-error" role="alert" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {fieldErrors.max_members}
                </p>
              )}
              <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-[#dce3ec] border border-[#cbd5e1] text-xs text-[#475569]">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#d88299]" />
                <span>
                  You will count as 1 member automatically. Set between {MIN_MEMBERS} and{' '}
                  {MAX_MEMBERS} total members.
                </span>
              </div>
            </div>

            {/* Preview / Info row */}
            <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#d88299]" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                  Preview
                </h2>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-[#475569]">Title</dt>
                <dd className="font-semibold text-white truncate">{fields.title.trim() || '—'}</dd>
                <dt className="text-[#475569]">Course</dt>
                <dd className="font-semibold text-white">{fields.course_code.trim().toUpperCase() || '—'}</dd>
                <dt className="text-[#475569]">Schedule</dt>
                <dd className="font-semibold text-white truncate">{fields.meeting_schedule.trim() || '—'}</dd>
                <dt className="text-[#475569]">Location</dt>
                <dd className="font-semibold text-white truncate">{fields.location.trim() || '—'}</dd>
                <dt className="text-[#475569]">Max Members</dt>
                <dd className="font-semibold text-white">{fields.max_members || '—'}</dd>
                <dt className="text-[#475569]">Creator</dt>
                <dd className="font-semibold text-white">
                  {user.name} {user.surname}
                </dd>
              </dl>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Link
                href="/study-groups"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#334155] bg-[#dce3ec] border border-[#cbd5e1] hover:bg-[#cbd5e1] transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Create study group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Create Study Group
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
