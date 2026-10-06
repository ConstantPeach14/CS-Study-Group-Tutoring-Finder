'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import {
  Library,
  Search,
  BookOpen,
  GraduationCap,
  Users,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Filter,
  PlusCircle,
} from 'lucide-react';

interface Module {
  id: number;
  code: string;
  name: string;
  faculty: string;
  description: string | null;
  student_count: number;
  tutor_count: number;
  group_count: number;
  is_enrolled?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const FACULTIES = [
  'All Faculties',
  'Computer Science & STEM',
  'Information Systems',
  'Mathematics & Statistics',
  'Natural & Applied Sciences',
];

export default function ModulesPage() {
  const { user, token } = useAuth();

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('All Faculties');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchModules = async () => {
      try {
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE_URL}/api/modules`, { headers });
        if (res.ok && isMounted) {
          const data = await res.json();
          setModules(data.modules || []);
        }
      } catch (err) {
        console.error('Failed to fetch modules:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchModules();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Handle student enrollment
  const handleEnroll = async (moduleId: number) => {
    if (!token) return;
    setActionLoadingId(moduleId);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/modules/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ module_id: moduleId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Successfully enrolled in ${data.module.code}!` });
        // Update local state
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId
              ? { ...m, is_enrolled: true, student_count: m.student_count + 1 }
              : m
          )
        );
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to enroll.' });
      }
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Network error enrolling in module.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle tutor registration
  const handleTutorRegister = async (moduleId: number) => {
    if (!token) return;
    setActionLoadingId(moduleId);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tutors/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ module_id: moduleId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Registered as tutor for ${data.module.code}!` });
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId
              ? { ...m, is_enrolled: true, tutor_count: m.tutor_count + 1 }
              : m
          )
        );
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to register as tutor.' });
      }
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Network error registering as tutor.' });
    } finally {
      setActionLoadingId(null);
    }
  };


  // Filter modules by search and faculty
  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        mod.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mod.description && mod.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFaculty =
        selectedFaculty === 'All Faculties' ||
        mod.faculty.toLowerCase() === selectedFaculty.toLowerCase();

      return matchesSearch && matchesFaculty;
    });
  }, [modules, searchQuery, selectedFaculty]);

  return (
    <div className="min-h-screen bg-[#e8edf2] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fce7ec] border border-[#e89aae] text-xs font-bold text-[#9c4f65] mb-3">
                <Library className="w-3.5 h-3.5" />
                University Academic Directory
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight">
                Academic Course & Module Directory
              </h1>
              <p className="mt-2 text-base text-[#334155] max-w-2xl">
                Browse verified courses, enroll to find fellow classmates, explore active study groups,
                or connect with certified peer tutors for your modules.
              </p>
            </div>

            {user?.role === 'student' && (
              <div className="flex items-center gap-3">
                <Link
                  href="/student/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#1e293b] bg-[#f1f4f8] hover:bg-[#dce3ec] border border-[#cbd5e1] shadow-xs transition-colors"
                >
                  My Enrolled Courses
                </Link>
                <Link
                  href="/study-groups/create"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] border border-[#d47b93] shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Study Group
                </Link>
              </div>
            )}
          </div>

          {/* Feedback message banner */}
          {feedbackMessage && (
            <div
              className={`mt-4 p-4 rounded-xl border flex items-center justify-between text-sm font-semibold ${
                feedbackMessage.type === 'success'
                  ? 'bg-[#fce7ec] border-[#e89aae] text-[#9c4f65]'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}
            >
              <span>{feedbackMessage.text}</span>
              <button
                onClick={() => setFeedbackMessage(null)}
                className="text-xs uppercase font-bold tracking-wider hover:opacity-75 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Search & Faculty Filters */}
        <div className="bg-[#f1f4f8] border border-[#cbd5e1] rounded-2xl p-5 mb-8 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-7 relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9c4f65]/70" />
              <input
                type="text"
                placeholder="Search by course code (e.g. CSC101) or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#fce7ec] border border-[#d88299] text-[#0f172a] placeholder-[#9c4f65]/60 focus:ring-2 focus:ring-[#d88299] focus:border-[#d88299] focus:outline-hidden text-sm font-medium transition-all"
              />
            </div>

            {/* Faculty Dropdown Filter */}
            <div className="md:col-span-5 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#9c4f65] shrink-0" />
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#fce7ec] border border-[#d88299] text-[#0f172a] focus:ring-2 focus:ring-[#d88299] focus:border-[#d88299] focus:outline-hidden text-sm font-medium cursor-pointer"
              >
                {FACULTIES.map((fac) => (
                  <option key={fac} value={fac}>
                    {fac}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter Pills (derived dynamically from existing courses) */}
          {modules.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#cbd5e1]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748b] mr-1">
                Courses:
              </span>
              {modules.slice(0, 8).map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setSearchQuery(mod.code)}
                  className={`text-xs px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                    searchQuery.toUpperCase() === mod.code.toUpperCase()
                      ? 'bg-[#d88299] text-[#1e293b] shadow-xs'
                      : 'bg-[#dce3ec] text-[#334155] hover:bg-[#fce7ec] hover:text-[#9c4f65]'
                  }`}
                >
                  {mod.code}
                </button>
              ))}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#9c4f65] font-bold underline hover:opacity-80 ml-auto cursor-pointer"
                >
                  Clear Filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modules Grid */}
        {loading ? (
          <div className="bg-[#f1f4f8] border border-[#cbd5e1] rounded-2xl p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[#9c4f65] animate-spin mb-3" />
            <p className="text-sm font-bold text-[#334155]">Loading course directory...</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-[#f1f4f8] border border-[#cbd5e1] rounded-2xl p-16 text-center">
            <Library className="w-12 h-12 text-[#9c4f65] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#0f172a]">No modules available yet</h3>
            <p className="mt-1 text-sm text-[#334155] max-w-md mx-auto">
              No university course modules have been registered yet.
            </p>
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="bg-[#f1f4f8] border border-[#cbd5e1] rounded-2xl p-16 text-center">
            <Library className="w-12 h-12 text-[#9c4f65] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#0f172a]">No matching modules found</h3>
            <p className="mt-1 text-sm text-[#334155] max-w-md mx-auto">
              No course modules match your search query &quot;{searchQuery}&quot;. Try resetting your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFaculty('All Faculties');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {filteredModules.map((mod) => (
              <div
                key={mod.id}
                className="bg-[#f1f4f8] border border-[#cbd5e1] rounded-2xl p-6 flex flex-col justify-between hover:border-[#d88299] hover:shadow-md transition-all group"
              >
                <div>
                  {/* Top Header Badge & Faculty */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-xl text-sm font-extrabold bg-[#fce7ec] border border-[#e89aae] text-[#9c4f65]">
                      {mod.code}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#dce3ec] text-[#334155] truncate max-w-[180px]">
                      {mod.faculty}
                    </span>
                  </div>

                  {/* Module Title */}
                  <h3 className="text-lg font-bold text-[#0f172a] group-hover:text-[#9c4f65] transition-colors">
                    <Link href={`/modules/${mod.id}`}>{mod.name}</Link>
                  </h3>

                  {/* Module Description */}
                  <p className="mt-2 text-xs text-[#334155] line-clamp-3 leading-relaxed">
                    {mod.description || 'No module description provided.'}
                  </p>

                  {/* Key Metrics / Activity Count */}
                  <div className="mt-5 grid grid-cols-3 gap-2 py-3 px-3.5 rounded-xl bg-[#dce3ec]/70 border border-[#cbd5e1] text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[#9c4f65] mb-0.5">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-xs font-extrabold text-[#0f172a]">
                          {mod.student_count}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                        Students
                      </span>
                    </div>

                    <div className="border-x border-[#cbd5e1]">
                      <div className="flex items-center justify-center gap-1 text-[#9c4f65] mb-0.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span className="text-xs font-extrabold text-[#0f172a]">
                          {mod.tutor_count}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                        Tutors
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-1 text-[#9c4f65] mb-0.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="text-xs font-extrabold text-[#0f172a]">
                          {mod.group_count}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                        Groups
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-4 border-t border-[#cbd5e1] flex items-center justify-between gap-2">
                  <Link
                    href={`/modules/${mod.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9c4f65] hover:text-[#c46982] transition-colors"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {/* Role-Specific Action Button */}
                  {mod.is_enrolled ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#fce7ec] border border-[#e89aae] text-xs font-bold text-[#9c4f65]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {user?.role === 'tutor' ? 'Teaching' : 'Enrolled'}
                    </span>
                  ) : user?.role === 'student' ? (
                    <button
                      onClick={() => handleEnroll(mod.id)}
                      disabled={actionLoadingId === mod.id}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] border border-[#d47b93] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoadingId === mod.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Enroll Course'
                      )}
                    </button>
                  ) : user?.role === 'tutor' ? (
                    <button
                      onClick={() => handleTutorRegister(mod.id)}
                      disabled={actionLoadingId === mod.id}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#1e293b] bg-[#d88299] hover:bg-[#c46982] border border-[#d47b93] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoadingId === mod.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Teach Module'
                      )}
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[#334155] bg-[#dce3ec] hover:bg-[#fce7ec] hover:text-[#9c4f65] transition-colors"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
