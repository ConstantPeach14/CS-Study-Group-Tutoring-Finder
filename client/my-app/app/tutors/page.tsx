'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Search,
  BookOpen,
  Calendar,
  Award,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  Mail,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */

interface Tutor {
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
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getInitials(name: string, surname: string): string {
  return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
}

/* ─── Skeleton Loader ─────────────────────────────────────── */

function TutorsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] p-6 space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#dce3ec]" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 bg-[#dce3ec] rounded" />
              <div className="h-3 w-24 bg-[#dce3ec] rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-[#dce3ec] rounded" />
            <div className="h-3 w-5/6 bg-[#dce3ec] rounded" />
          </div>
          <div className="h-8 w-full bg-[#dce3ec] rounded-lg mt-4" />
        </div>
      ))}
    </div>
  );
}

export default function TutorsCatalogPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* Filter & search states */
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  /* Debounce search input */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* Fetch tutors from backend */
  useEffect(() => {
    let isMounted = true;
    const fetchTutors = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (courseFilter !== 'all') params.set('course_code', courseFilter);
        if (subjectFilter !== 'all') params.set('subject', subjectFilter);

        const res = await fetch(`${API_BASE_URL}/api/tutors?${params.toString()}`);
        if (!isMounted) return;

        if (!res.ok) {
          throw new Error('Failed to load tutors.');
        }

        const data = await res.json();
        if (isMounted) {
          setTutors(data.tutors || []);
        }
      } catch {
        if (isMounted) {
          setError('Unable to load tutors at this time. Please check your connection and try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTutors();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, courseFilter, subjectFilter]);

  /* Extract unique course codes for quick filter chips */
  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    tutors.forEach((t) => {
      if (t.course_codes) {
        t.course_codes.split(',').forEach((c) => {
          const trimmed = c.trim().toUpperCase();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [tutors]);

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setCourseFilter('all');
    setSubjectFilter('all');
  };

  const isFiltering = searchInput !== '' || courseFilter !== 'all' || subjectFilter !== 'all';

  return (
    <div className="min-h-screen bg-[#e8edf2] py-8 sm:py-12 text-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* ── Header ────────────────────────────────────────── */}
        <div className="bg-[#f1f4f8] rounded-2xl p-6 sm:p-8 border border-[#cbd5e1] shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fce7ec] border border-[#e89aae] text-[#9c4f65] text-xs font-semibold mb-2">
              <GraduationCap className="w-4 h-4" /> Peer Tutoring Network
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              Find a Peer Tutor
            </h1>
            <p className="mt-1 text-sm text-[#334155] max-w-xl">
              Discover verified high-performing classmates to receive personalized guidance,
              clarify challenging course concepts, and master university modules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/study-groups"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#334155] bg-[#dce3ec] hover:bg-[#cbd5e1] border border-[#cbd5e1] transition-colors"
            >
              Browse Study Groups
            </Link>
          </div>
        </div>

        {/* ── Search & Filter Bar ─────────────────────────────── */}
        <div className="bg-[#f1f4f8] rounded-2xl p-5 border border-[#cbd5e1] shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search by tutor name, subject (e.g., Algorithms), course code, or bio..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#e8edf2] border border-[#cbd5e1] rounded-xl text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-hidden focus:border-[#d88299] focus:ring-1 focus:ring-[#d88299] transition-colors"
                aria-label="Search peer tutors"
              />
            </div>

            {/* Course Filter Dropdown */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#334155] uppercase tracking-wider shrink-0">
                  Course:
                </span>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="bg-[#e8edf2] border border-[#cbd5e1] rounded-xl px-3 py-2 text-sm text-[#334155] focus:outline-hidden focus:border-[#d88299] transition-colors cursor-pointer"
                  aria-label="Filter by course code"
                >
                  <option value="all">All Courses</option>
                  {availableCourses.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>

              {isFiltering && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#9c4f65] hover:bg-[#fce7ec] transition-colors border border-[#e89aae]"
                  aria-label="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Quick Course Chips */}
          {availableCourses.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#cbd5e1]">
              <span className="text-xs text-[#64748b] font-medium mr-1">Popular:</span>
              {availableCourses.slice(0, 8).map((code) => (
                <button
                  key={code}
                  onClick={() => setCourseFilter(courseFilter === code ? 'all' : code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    courseFilter === code
                      ? 'bg-[#d88299] text-white'
                      : 'bg-[#e8edf2] text-[#334155] hover:text-[#0f172a] border border-[#cbd5e1]'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Content: Grid / Error / Empty ────────────────────── */}
        {isLoading ? (
          <TutorsSkeleton />
        ) : error ? (
          <div className="bg-[#f1f4f8] rounded-2xl p-8 border border-[#e89aae] text-center max-w-xl mx-auto space-y-4">
            <AlertCircle className="w-10 h-10 text-[#9c4f65] mx-auto" />
            <h3 className="text-lg font-bold text-[#0f172a]">Error Loading Tutors</h3>
            <p className="text-sm text-[#334155]">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setSearchInput('');
              }}
              className="px-5 py-2.5 bg-[#d88299] hover:bg-[#c46982] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : tutors.length === 0 ? (
          <div className="bg-[#f1f4f8] rounded-2xl p-12 border border-[#cbd5e1] text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#fce7ec] border border-[#e89aae] flex items-center justify-center mx-auto text-[#9c4f65]">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#0f172a]">No Tutors Found</h3>
            <p className="text-sm text-[#475569]">
              {isFiltering
                ? 'No peer tutors match your search or filter criteria. Try adjusting your search keywords or clearing your filters.'
                : 'There are currently no verified tutors available. Check back soon!'}
            </p>
            {isFiltering && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d88299] hover:bg-[#c46982] text-white text-sm font-bold rounded-xl shadow-xs transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-[#64748b] px-1">
              <span>
                Showing <strong className="text-[#0f172a]">{tutors.length}</strong> verified peer tutor
                {tutors.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutors.map((tutor) => {
                const courseList = tutor.course_codes
                  ? tutor.course_codes.split(',').map((c) => c.trim())
                  : [];

                return (
                  <div
                    key={tutor.tutor_id}
                    className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] hover:border-[#d88299] hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-6 space-y-4">
                      {/* Tutor Avatar & Identity Header */}
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#fce7ec] border border-[#e89aae] flex items-center justify-center text-[#9c4f65] font-bold text-lg shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                          {getInitials(tutor.name, tutor.surname)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae] text-[11px] font-semibold mb-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified Tutor
                          </div>
                          <h2 className="text-lg font-bold text-[#0f172a] truncate group-hover:text-[#9c4f65] transition-colors">
                            {tutor.name} {tutor.surname}
                          </h2>
                          <p className="text-xs text-[#64748b] truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#94a3b8]" />
                            {tutor.email}
                          </p>
                        </div>
                      </div>

                      {/* Bio snippet */}
                      <p className="text-xs text-[#334155] line-clamp-3 leading-relaxed">
                        {tutor.bio || 'Verified university peer tutor available to help classmates succeed in coursework and exams.'}
                      </p>

                      {/* Course Codes Badges */}
                      {courseList.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-[#cbd5e1]">
                          <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wide flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-[#9c4f65]" /> Courses:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {courseList.slice(0, 4).map((code) => (
                              <span
                                key={code}
                                className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#fce7ec] text-[#9c4f65] border border-[#e89aae]"
                              >
                                {code}
                              </span>
                            ))}
                            {courseList.length > 4 && (
                              <span className="text-[11px] text-[#64748b] self-center">
                                +{courseList.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Qualifications */}
                      {tutor.qualifications && (
                        <div className="text-xs text-[#334155] flex items-start gap-1.5 pt-1">
                          <Award className="w-3.5 h-3.5 text-[#9c4f65] shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{tutor.qualifications}</span>
                        </div>
                      )}

                      {/* Availability */}
                      {tutor.availability && (
                        <div className="text-xs text-[#334155] flex items-start gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#9c4f65] shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{tutor.availability}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="bg-[#dce3ec] px-6 py-3.5 border-t border-[#cbd5e1] flex items-center justify-between gap-3">
                      <span className="text-[11px] text-[#64748b]">
                        {tutor.subjects ? tutor.subjects.split(',')[0] : 'General Tutoring'}
                      </span>

                      <Link
                        href={`/tutors/${tutor.tutor_id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors shadow-xs"
                      >
                        View Profile
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
