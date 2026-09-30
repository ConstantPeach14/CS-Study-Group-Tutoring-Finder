'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  PlusCircle,
  MapPin,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  X,
  BookOpen,
} from 'lucide-react';

interface StudyGroup {
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
  creator_name: string;
  creator_surname: string;
  creator_email: string;
  creator_role: string;
  member_count: number;
  is_full: boolean;
  is_member: boolean;
  is_creator: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function StudyGroupsCatalogPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'full'>('all');
  const [myGroupsOnly, setMyGroupsOnly] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  // Extract unique course codes from groups list for quick filter pills
  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => {
      if (g.course_code) set.add(g.course_code.toUpperCase());
    });
    return Array.from(set).sort();
  }, [groups]);

  // Fetch groups from API
  useEffect(() => {
    let isMounted = true;

    const fetchStudyGroups = async () => {
      try {
        setIsLoading(true);

        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // If "my groups only" toggle is active, fetch from /api/study-groups/user/my
        let endpoint = `${API_BASE_URL}/api/study-groups`;
        if (myGroupsOnly && token) {
          endpoint = `${API_BASE_URL}/api/study-groups/user/my`;
        } else {
          const params = new URLSearchParams();
          if (debouncedSearch) {
            params.append('search', debouncedSearch);
          }
          if (courseFilter && courseFilter !== 'all') {
            params.append('course_code', courseFilter);
          }
          if (statusFilter && statusFilter !== 'all') {
            params.append('status', statusFilter);
          }
          const queryString = params.toString();
          if (queryString) {
            endpoint += `?${queryString}`;
          }
        }

        const response = await fetch(endpoint, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${response.status}`);
        }

        const data = await response.json();
        if (!isMounted) return;

        setGroups(data.study_groups || []);
        setError(null);
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('Error fetching study groups:', err);
        const message = err instanceof Error ? err.message : 'Unable to connect to the server.';
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStudyGroups();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, courseFilter, statusFilter, myGroupsOnly, token, user, refreshTrigger]);

  const handleRetry = () => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Handle "Create Study Group" button click
  const handleCreateGroupClick = () => {
    if (!user) {
      router.push('/login?redirect=/study-groups/create');
    } else {
      router.push('/study-groups/create');
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setCourseFilter('all');
    setStatusFilter('all');
    setMyGroupsOnly(false);
  };

  const hasActiveFilters = searchInput || courseFilter !== 'all' || statusFilter !== 'all' || myGroupsOnly;

  return (
    <div className="flex-1 py-8 sm:py-12 bg-[#e8edf2] text-[#0f172a] min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="bg-[#f1f4f8] rounded-2xl p-6 sm:p-8 border border-[#cbd5e1] shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fce7ec] border border-[#9c4f65]/40 text-[#d88299] text-xs font-semibold">
              <Users className="w-3.5 h-3.5" /> Module Study Groups
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Study Groups
            </h1>
            <p className="text-sm text-[#475569] leading-relaxed">
              Discover, join and collaborate in peer study groups for your university courses. Connect
              with classmates, share coursework insights, and prepare for exams together.
            </p>
          </div>

          <button
            onClick={handleCreateGroupClick}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-[#d88299] hover:bg-[#c46982] shadow-md transition-colors cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Create Study Group
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#f1f4f8] rounded-2xl p-5 border border-[#cbd5e1] shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by course code or study group title..."
                className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-[#cbd5e1] focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] bg-[#e8edf2] text-white placeholder:text-[#64748b]"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-white cursor-pointer"
                  aria-label="Clear search input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Course Code Filter */}
            <div className="md:col-span-3">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                disabled={myGroupsOnly}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#cbd5e1] focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] bg-[#e8edf2] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">All Courses</option>
                {availableCourses.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'all' | 'open' | 'full')
                }
                disabled={myGroupsOnly}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-[#cbd5e1] focus:outline-hidden focus:ring-1 focus:ring-[#d88299] focus:border-[#d88299] bg-[#e8edf2] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open (Spots Available)</option>
                <option value="full">Full (Capacity Reached)</option>
              </select>
            </div>
          </div>

          {/* Sub-bar: My Groups toggle & Active filter chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#cbd5e1] text-xs">
            <div className="flex items-center gap-2">
              {user && (
                <button
                  onClick={() => setMyGroupsOnly(!myGroupsOnly)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                    myGroupsOnly
                      ? 'bg-[#d88299] text-white shadow-xs'
                      : 'bg-[#dce3ec] text-[#334155] hover:bg-[#cbd5e1]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  My Groups Only
                </button>
              )}

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-[#475569] hover:text-[#d88299] underline cursor-pointer ml-1"
                >
                  Reset all filters
                </button>
              )}
            </div>

            <div className="text-[#475569]">
              Showing <span className="font-semibold text-white">{groups.length}</span>{' '}
              {groups.length === 1 ? 'study group' : 'study groups'}
            </div>
          </div>
        </div>

        {/* Content Body: Loading / Error / Grid */}
        {isLoading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#d88299] mb-3" />
            <p className="text-sm font-medium text-[#475569]">
              Loading university study groups...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h3 className="text-base font-semibold text-red-200">
              Unable to load study groups
            </h3>
            <p className="text-xs text-red-300 max-w-md mx-auto">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#d88299] hover:bg-[#c46982] cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] p-12 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[#fce7ec] border border-[#9c4f65]/40 text-[#d88299] flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No study groups found</h3>
              <p className="text-sm text-[#475569] max-w-md mx-auto">
                {hasActiveFilters
                  ? 'No study groups match your current filter criteria. Try adjusting your search keywords or resetting filters.'
                  : 'There are no active study groups yet. Be the first student or tutor to create a collaborative study group!'}
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#d88299] bg-[#dce3ec] border border-[#cbd5e1] hover:bg-[#cbd5e1] cursor-pointer"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleCreateGroupClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#d88299] hover:bg-[#c46982] shadow-md cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Create First Study Group
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => {
              const capacityPercent = Math.min(
                100,
                Math.round((group.member_count / group.max_members) * 100)
              );
              const isFull = group.is_full || group.member_count >= group.max_members;

              return (
                <div
                  key={group.id}
                  className="bg-[#f1f4f8] rounded-2xl border border-[#cbd5e1] shadow-lg hover:border-[#9c4f65]/60 transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    {/* Badges row: Course Code & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#fce7ec] text-[#d88299] border border-[#9c4f65]/40 tracking-wide uppercase">
                        {group.course_code}
                      </span>

                      {isFull ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#dce3ec] text-[#475569] border border-[#cbd5e1]">
                          Full
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fce7ec] text-[#d88299] border border-[#e89aae]/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d88299]"></span>
                          Open
                        </span>
                      )}
                    </div>

                    {/* Group Title & Description */}
                    <div>
                      <h2 className="text-lg font-bold text-white leading-snug line-clamp-1">
                        {group.title}
                      </h2>
                      <p className="mt-1.5 text-xs text-[#475569] line-clamp-2 leading-relaxed">
                        {group.description || 'No description provided for this group.'}
                      </p>
                    </div>

                    {/* Schedule & Location Logistics */}
                    <div className="space-y-2 pt-2 border-t border-[#cbd5e1] text-xs text-[#334155]">
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-[#d88299] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{group.meeting_schedule}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#d88299] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{group.location}</span>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#475569] font-medium">Capacity</span>
                        <span className="font-semibold text-white">
                          {group.member_count} / {group.max_members} members
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#e8edf2] overflow-hidden border border-[#cbd5e1]">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isFull ? 'bg-slate-500' : 'bg-[#d88299]'
                          }`}
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div className="pt-2 text-[11px] text-[#475569] flex items-center justify-between">
                      <span className="truncate">
                        By {group.creator_name} {group.creator_surname}
                      </span>
                      <span className="capitalize text-[#64748b]">({group.creator_role})</span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="bg-[#dce3ec] px-6 py-3.5 border-t border-[#cbd5e1] flex items-center justify-between gap-3">
                    <Link
                      href={`/study-groups/${group.id}`}
                      className="text-xs font-semibold text-[#334155] hover:text-[#d88299] inline-flex items-center gap-1 transition-colors"
                    >
                      View Details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* Contextual Action Button */}
                    {!user ? (
                      <Link
                        href={`/login?redirect=/study-groups/${group.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#d88299] bg-[#fce7ec] border border-[#e89aae]/40 hover:bg-[#1b382d] transition-colors"
                      >
                        Log in to Join
                      </Link>
                    ) : group.is_creator ? (
                      <Link
                        href={`/study-groups/${group.id}/edit`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Manage
                      </Link>
                    ) : group.is_member ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#d88299] bg-[#fce7ec] border border-[#e89aae]/40">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Joined
                      </span>
                    ) : isFull ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#475569] bg-[#e8edf2] border border-[#cbd5e1] cursor-not-allowed">
                        Group Full
                      </span>
                    ) : (
                      <Link
                        href={`/study-groups/${group.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#d88299] hover:bg-[#c46982] transition-colors"
                      >
                        Join Group
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
