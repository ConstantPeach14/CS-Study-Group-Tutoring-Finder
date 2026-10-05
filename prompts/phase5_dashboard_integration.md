# Phase 5 — Dashboard & Full System Integration

## Summary

Enhance both Student and Tutor dashboards so they serve as comprehensive hubs for the
application. Each dashboard will surface real data from existing APIs (study groups, tutor
profiles, tutoring requests) with proper loading, empty, and error states.

No backend changes required — all APIs already exist. This is purely a frontend integration
phase.

## What Already Exists (no changes needed)
- Auth system (register, login, JWT, roles, AuthContext, ProtectedRoute)
- Navbar with role-based navigation (dashboard, study groups, tutors, profile, logout)
- Study groups CRUD (create, view, search, filter, join, leave, edit, delete)
- Tutor finder (list, search, filter, view profile, request tutoring)
- Tutor profile management (create/update via upsert, view own profile)
- Tutoring requests (create, view sent/received, accept/decline/cancel)
- Student profile page (read-only display)
- Tutor profile page (editable form)
- Light Grey + Dusty Pink theme (globals.css, all components)

## What Needs Enhancement

### 1. Student Dashboard
- Add profile summary card
- Add "My Study Groups" section showing actual group cards
- Add quick actions section

### 2. Tutor Dashboard
- Add tutor profile summary section
- Add "My Study Groups" section with actual group cards
- Add quick actions section
- Better empty state for missing tutor profile
