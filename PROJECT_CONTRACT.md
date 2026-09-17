# Project Charter & Specification Contract
## CS-Study-Group-Tutoring-Finder

**Document Version:** 1.0.0  
**Status:** Active Baseline Contract  
**Platform Name:** Study Group & Tutoring Finder  
**Author:** Wanani Mamidza  
**Last Updated:** September 2026  

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem
In modern university environments—particularly within large first-year lecture halls and foundational Computer Science / STEM modules—students often experience academic isolation. Key issues include:
* **Disconnection:** Students do not know who among their classmates lives nearby, shares their schedule, or is seeking study partners.
* **Lack of Timely Assistance:** Course teaching assistants and professors have constrained consultation hours, leaving students stranded when struggling with coursework.
* **Underutilized Peer Knowledge:** Qualified senior students and high-achieving peers willing to offer tutoring lack a centralized, reputable campus directory to connect with learners.

### 1.2 The Solution
The **Study Group & Tutoring Finder** is a centralized, module-centric web platform tailored specifically for university students. It bridges the gap by:
1. Enabling students to discover peers enrolled in the exact same modules and form structured, collaborative study groups.
2. Allowing qualified student tutors to advertise subject expertise and manage peer tutoring sessions.
3. Providing role-protected environments, scheduling tools, and verified academic networking.

---

## 2. Technical Stack & Architectural Standards

| Tier | Technology | Specification / Role |
|---|---|---|
| **Frontend Framework** | Next.js 16 (App Router) | Server and client components, optimized page prerendering, Turbopack |
| **Language** | TypeScript / JavaScript | Type safety across API client, contexts, and UI props |
| **Styling** | Tailwind CSS + CSS Modules | Modular utilities, responsive grid layouts, custom theme tokens |
| **Backend Framework** | Node.js + Express.js 5 | Lightweight RESTful microservice handling business logic and auth |
| **Database** | Neon PostgreSQL (Serverless) | Cloud-hosted PostgreSQL with SSL pooler connection |
| **Authentication** | JSON Web Tokens (JWT) | Stateless auth with 7-day expiry and role claims (`student`, `tutor`) |
| **Password Security** | bcryptjs | One-way password hashing with 10 salt rounds |
| **Icons & Assets** | Lucide React | Semantic iconography for navigation, metrics, and alerts |
| **Local Ports** | Frontend: `3000` / Backend: `5000` | Cross-Origin Resource Sharing (CORS) configured |

---

## 3. Visual Identity & Design System Contract

The platform enforces a strict, distraction-free university color palette:

* **Grey (`#F1F5F9`, `#E2E8F0`, `#94A3B8`):** Page backgrounds, neutral borders, cards, section separators, and subtle container fills.
* **Light Blue (`#0284C7`, `#38BDF8`, `#E0F2FE`):** Links, interactive highlights, secondary buttons, focus rings, and secondary indicators.
* **Burgundy (`#800020`, `#650019`):** Primary action buttons, brand headings, active navigation states, role badges, and primary emphasis.
* **White (`#FFFFFF`):** Card surface backgrounds and high-contrast text.
* **Dark Grey (`#1E293B`, `#334155`):** Primary body text, labels, and typography.
* **Prohibited Colors:** Purple or pink are explicitly prohibited across all primary workflows and components.

---

## 4. Current Database Schema Contract

The application operates against the verified Neon PostgreSQL database.

### 4.1 `users` Table (Active)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'tutor')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Security Constraints
* Passwords must **never** be stored as plain text.
* Passwords and password hashes must **never** be returned in API payloads (`/api/users/me`, `/api/auth/login`, `/api/auth/register`).
* Email lookups must be normalized and case-insensitive (`LOWER(email)`).
* All SQL queries must use parameterized placeholders (`$1`, `$2`) to eliminate SQL injection risks.

---

## 5. Master Roadmap: Phases & Sprints

```
========================================================================================================================
                                     STUDY GROUP & TUTORING FINDER ROADMAP
========================================================================================================================
[Phase 1: Setup]  -->  [Phase 2: UI & Nav]  -->  [Phase 3: DB & API]  -->  [Phase 4: Auth & JWT]  -->  [Phase 5: Roles]
  (Days 1–3)             (Days 4–5)                (Days 6–7)                 (Days 8–9)                 (Day 10)
   COMPLETED              COMPLETED                 COMPLETED                  COMPLETED                  COMPLETED
------------------------------------------------------------------------------------------------------------------------
[Phase 6: Modules] --> [Phase 7: Study Groups] --> [Phase 8: Tutoring Requests] --> [Phase 9: Reviews] --> [Phase 10]
  (Days 11–15)           (Days 16–20)                 (Days 21–25)                    (Days 26–28)       (Days 29–35)
    UPCOMING               UPCOMING                     UPCOMING                        UPCOMING           UPCOMING
========================================================================================================================
```

---

### PHASE 1: Project Setup & Monorepo Architecture
* **Timeline:** Days 1–3  
* **Status:** `COMPLETED`  

#### Sprint 1 (Days 1–3) Deliverables:
1. Initialize project structure separating client (`client/my-app/`) and backend (`server/`).
2. Configure version control `.gitignore` protecting `.env` and `node_modules`.
3. Scaffold base Next.js application with TypeScript and Tailwind CSS.
4. Scaffold Express.js backend with foundational HTTP server listener.

---

### PHASE 2: Frontend Pages, Navigation & Responsive Layout
* **Timeline:** Days 4–5  
* **Status:** `COMPLETED`  

#### Sprint 1 (Days 4–5) Deliverables:
1. **Home Page (`/`):** Hero section, value proposition, module study group overview, call-to-actions.
2. **About Page (`/about`):** Platform mission, core academic principles, student and tutor benefit breakdowns.
3. **Login Page (`/login`):** Authentication form card, error notifications, link to registration.
4. **Register Page (`/register`):** Registration form with role selection (`student` vs `tutor`), validation feedback.
5. **Dashboard Placeholders:**
   * Student Dashboard (`/student/dashboard`)
   * Tutor Dashboard (`/tutor/dashboard`)
6. **Profile Placeholders:**
   * Student Profile (`/student/profile`)
   * Tutor Profile (`/tutor/profile`)
7. **Responsive Navigation Bar (`Navbar.tsx`):**
   * Unauthenticated links: Home, About, Login, Register.
   * Authenticated links: Dynamic role-specific Dashboard, Profile, and Logout.
   * Active state indicator in Burgundy.
   * Mobile navigation drawer with hamburger toggle.
8. **University Academic Footer (`Footer.tsx`):** Links, institutional support info, security policy links.

---

### PHASE 3: Express.js Backend & Neon PostgreSQL Connection
* **Timeline:** Days 6–7  
* **Status:** `COMPLETED`  

#### Sprint 2 (Days 6–7) Deliverables:
1. Connect Express.js to remote Neon PostgreSQL using `pg.Pool` with SSL support (`rejectUnauthorized: false`).
2. Protect connection string in `server/.env` via `DATABASE_URL`.
3. Establish health check endpoint:
   * `GET /api/health` — Returns status 200, server health message, and live database timestamp verification.
4. Prevent schema destruction: direct integration with pre-existing `users` table without dropping or mutating tables.

---

### PHASE 4: User Registration, Login & Authentication
* **Timeline:** Days 8–9  
* **Status:** `COMPLETED`  

#### Sprint 2 (Days 8–9) Deliverables:
1. **Registration Workflow (`POST /api/auth/register`):**
   * Validation of name, surname, email format, password matching, minimum password length (6 characters), and role restriction (`student` | `tutor`).
   * Duplicate email rejection (409 Conflict).
   * Password encryption via `bcryptjs` (10 rounds).
   * Safe return of created user entity without exposing password hash.
2. **Login Workflow (`POST /api/auth/login`):**
   * Email lookup and bcrypt hash comparison.
   * JWT generation containing `{ id, email, role }` signed with `JWT_SECRET` (7-day validity).
   * Safe response returning token and user metadata.
3. **Logout Workflow (`POST /api/auth/logout`):**
   * Safe session termination confirmation.
4. **Client Session Management (`AuthContext.tsx`):**
   * Token persistence in `localStorage`.
   * Automatic session validation and profile hydration on initial load.
   * Role-based post-login redirection (`/student/dashboard` or `/tutor/dashboard`).

---

### PHASE 5: Student & Tutor Roles, Profiles & Access Control
* **Timeline:** Day 10  
* **Status:** `COMPLETED`  

#### Sprint 2 (Day 10) Deliverables:
1. **JWT Verification Middleware (`authMiddleware.js`):**
   * Intercepts `Authorization: Bearer <token>` header, verifies signature, decodes payload, and attaches `req.user`. Rejects missing or expired tokens with 401.
2. **Role Enforcement Middleware (`roleMiddleware.js`):**
   * Validates user role against route permission requirements, denying unauthorized roles with 403 Forbidden.
3. **Current User Profile Endpoint (`GET /api/users/me`):**
   * Returns authenticated user profile (`id`, `name`, `surname`, `email`, `role`, `created_at`).
4. **Frontend Route Guards (`ProtectedRoute.tsx`):**
   * Redirects unauthenticated visitors to `/login`.
   * Enforces role isolation: students cannot access tutor pages (redirects to `/student/dashboard`), and tutors cannot access student pages (redirects to `/tutor/dashboard`).
5. **Role-Specific Profile Pages:**
   * Student Profile (`/student/profile`): Displays student credentials, role, and joined date.
   * Tutor Profile (`/tutor/profile`): Displays tutor credentials, role, and joined date.

---

### PHASE 6: Module & Academic Course Directory
* **Timeline:** Days 11–15  
* **Status:** `UPCOMING (Sprint 3)`  

#### Objectives:
Tie all study groups and tutoring sessions strictly to university course codes (e.g., `CSC101`, `INF201`, `MTH104`).

#### Deliverables:
1. **Database Schema Additions:**
   * `modules` table (`id`, `code`, `name`, `faculty`, `description`).
   * `user_modules` enrollment table (`id`, `user_id`, `module_id`, `role`).
2. **Backend Endpoints:**
   * `GET /api/modules` — List modules with course code search and filtering.
   * `POST /api/modules/enroll` — Allow a student to register enrolled courses.
   * `POST /api/tutors/modules` — Allow a tutor to register modules they are qualified to tutor.
   * `GET /api/users/me/modules` — List current user's active modules.
3. **Frontend Views:**
   * Module selection and management on Student and Tutor dashboards.
   * Course search bar with live filtering.
   * Module overview page showing active groups and tutors for that module.

---

### PHASE 7: Study Group Creation, Search & Membership
* **Timeline:** Days 16–20  
* **Status:** `UPCOMING (Sprint 4)`  

#### Objectives:
Enable students to initiate, search, join, and collaborate in peer study groups.

#### Deliverables:
1. **Database Schema Additions:**
   * `study_groups` table (`id`, `module_id`, `creator_id`, `title`, `description`, `location`, `meeting_time`, `max_members`, `is_active`, `created_at`).
   * `study_group_members` table (`group_id`, `user_id`, `joined_at`, `role`).
2. **Backend Endpoints:**
   * `POST /api/study-groups` — Create a new study group for a module.
   * `GET /api/study-groups` — Search/filter study groups by module, date, open capacity.
   * `POST /api/study-groups/:id/join` — Join a study group (with capacity constraint checks).
   * `POST /api/study-groups/:id/leave` — Leave a study group.
   * `GET /api/study-groups/:id/members` — List group members.
3. **Frontend Views:**
   * "Create Study Group" modal/page with form validation.
   * Study group card list with capacity badges (`3/5 members filled`).
   * Group detail view with member list and meeting instructions (physical campus spot or virtual link).

---

### PHASE 8: Peer Tutoring Discovery & Booking System
* **Timeline:** Days 21–25  
* **Status:** `UPCOMING (Sprint 5)`  

#### Objectives:
Allow students to search verified tutors by course and request 1-on-1 tutoring sessions.

#### Deliverables:
1. **Database Schema Additions:**
   * `tutor_profiles` table (`user_id`, `bio`, `qualifications`, `hourly_rate`, `availability_schedule`).
   * `tutoring_requests` table (`id`, `student_id`, `tutor_id`, `module_id`, `status` ['pending', 'accepted', 'declined', 'completed'], `session_time`, `notes`, `created_at`).
2. **Backend Endpoints:**
   * `GET /api/tutors` — Search tutors by module code, availability, and rating.
   * `GET /api/tutors/:id` — View full public tutor profile.
   * `POST /api/tutoring-requests` — Student submits booking request for a module.
   * `PATCH /api/tutoring-requests/:id` — Tutor accepts, declines, or reschedules request.
   * `GET /api/tutoring-requests/my` — Fetch student or tutor appointment list.
3. **Frontend Views:**
   * Tutor directory with search and filter controls.
   * Public tutor profile preview card.
   * "Request Tutoring" booking dialog with date/time selection.
   * Request management cards on Student & Tutor dashboards.

---

### PHASE 9: Ratings, Reviews & Academic Badging
* **Timeline:** Days 26–28  
* **Status:** `UPCOMING (Sprint 6)`  

#### Objectives:
Establish trust and accountability through peer ratings and reviews after completed tutoring sessions.

#### Deliverables:
1. **Database Schema Additions:**
   * `reviews` table (`id`, `request_id`, `student_id`, `tutor_id`, `rating` [1–5], `comment`, `created_at`).
2. **Backend Endpoints:**
   * `POST /api/reviews` — Submit a review after a session status is marked `completed`.
   * `GET /api/tutors/:id/reviews` — Fetch paginated reviews and aggregate score for a tutor.
3. **Frontend Views:**
   * Interactive star-rating and feedback component.
   * Tutor profile review section displaying average rating score and feedback history.
   * Peer endorsement badges (e.g., "Top Peer Tutor in CSC101").

---

### PHASE 10: In-App Notifications, Messaging & Production Hardening
* **Timeline:** Days 29–35  
* **Status:** `UPCOMING (Sprint 7)`  

#### Objectives:
Provide real-time updates, direct communication between confirmed study partners, and production readiness.

#### Deliverables:
1. **Notifications & Alerts:**
   * Notifications table for session updates, group invites, and booking status changes.
   * Dropdown notification bell in navigation bar.
2. **Unified Academic Calendar:**
   * Calendar view integrating study group sessions and booked tutoring appointments.
3. **Security & Production Audit:**
   * Express rate limiting (`express-rate-limit`) on authentication routes.
   * HTTP security headers with `helmet`.
   * Cross-Site Scripting (XSS) input sanitization.
   * Full accessibility compliance (WCAG 2.1 AA).
   * Automated end-to-end integration test suite.

---

## 6. Verification & Quality Assurance Protocols

Every phase must pass this quality gate before deployment or proceeding to subsequent sprints:

1. **Authentication Integrity:** Passwords must always hash with bcrypt; no plain text leaks in logs, errors, or network payloads.
2. **Role Isolation:** HTTP 401 for unauthenticated requests to protected endpoints; HTTP 403 for cross-role attempts.
3. **Database Consistency:** Zero orphan records; all relations enforced through foreign keys with appropriate cascade policies.
4. **Responsive Integrity:** Mobile hamburger menu, forms, and cards must maintain flawless rendering on screen viewports from 360px (mobile) to 1920px (desktop).
5. **Theme Compliance:** Strict adherence to Grey, Light Blue, and Burgundy. Zero occurrences of purple or pink.
6. **Code Standards:** Clean TypeScript compilation with zero lint warnings (`npm run lint` and `npm run build` must exit with code `0`).

---

## 7. Change Management & Governance

* Any change to this contract regarding scope, database schemas, or sprint timelines must be documented with an updated version increment (`1.x.x`).
* Previous sprint deliverables must not be overwritten or broken when subsequent features are integrated.
