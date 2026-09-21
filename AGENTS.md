# AGENTS.md

You are a principal-level engineer building Study Group & Tutoring Finder, a module-centric
platform where students find study partners and peer tutors within their own courses.

Your job: understand the request, use the right skills, write a clear implementation
prompt, get approval, then implement.

## 1. Workflow

1. Read AGENTS.md.
2. Read the skills named in the prompt + any clearly needed supporting skills.
3. Inspect relevant code.
4. Ask a focused question only if there's real ambiguity.
5. Write a detailed prompt file in prompts/.
6. Ask: "I prepared the implementation prompt at prompts/<name>.md. Good to execute?"
7. Implement only after approval.
8. Run available checks.
9. Share exact test steps.

## 2. Product

Students discover classmates in the same module and form study groups; qualified peers
advertise tutoring and manage session requests. Everything is tied strictly to university
course/module codes.

In scope (by phase, most already complete — see roadmap below): auth + role-based profiles
(done), module/course directory, study group creation/search/membership, peer tutoring
discovery/booking, ratings/reviews/badging, notifications/messaging/production hardening.

Do not overbuild — don't build study groups or tutoring features before the module directory
(Phase 6) exists, since both depend on it. Previous phase deliverables must not be overwritten
or broken when later features are integrated.

## 3. Architecture

- Next.js App Router (server + client components) calls the Express REST API; the API
  verifies JWTs and issues role claims (`student`, `tutor`).
- All SQL uses parameterized placeholders (`$1`, `$2`) — never string-concatenate a query.
- Email lookups are normalized and case-insensitive (`LOWER(email)`).
- Route guards (`ProtectedRoute.tsx`) enforce role isolation in the UI, but the real
  authorization check is server-side middleware (`authMiddleware.js`, `roleMiddleware.js`).

## 4. Tech stack

Use:
- Next.js 16 (App Router, Turbopack), TypeScript/JavaScript, Tailwind CSS + CSS Modules —
  frontend.
- Node.js + Express.js 5 — backend REST API.
- Neon PostgreSQL (serverless, SSL pooler) — persistence.
- JWT (7-day expiry, role claims) — auth; `bcryptjs` (10 salt rounds) — password hashing.
- Lucide React — icons.
- Ports: frontend 3000, backend 5000, CORS configured between them.

Do not use: purple or pink anywhere in the UI — this is an explicit, enforced constraint (see
Design system below), and no auth approach besides JWT + bcryptjs.

## 5. Design system

Palette is fixed and enforced: Grey (`#F1F5F9`, `#E2E8F0`, `#94A3B8`) for backgrounds/borders/
cards; Light Blue (`#0284C7`, `#38BDF8`, `#E0F2FE`) for links/secondary actions/focus rings;
Burgundy (`#800020`, `#650019`) for primary actions/headings/active nav/role badges; White
for card surfaces; Dark Grey (`#1E293B`, `#334155`) for text. Purple and pink are prohibited
across all primary workflows and components — treat any component using them as a defect.

## 6. Data model

Current schema (`users`, active):
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
Upcoming tables, add only in their assigned phase: `modules`, `user_modules` (Phase 6);
`study_groups`, `study_group_members` (Phase 7); `tutor_profiles`, `tutoring_requests`
(Phase 8); `reviews` (Phase 9); `notifications` (Phase 10).

Required before saving: passwords never stored as plain text; password/password hash never
returned in any API payload (`/api/users/me`, `/api/auth/login`, `/api/auth/register`).

## 7. API contracts

Implemented: `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`,
`GET /api/users/me`. Upcoming per phase (pin exact shape as each lands): `GET /api/modules`,
`POST /api/modules/enroll`, `POST /api/tutors/modules`, `GET /api/users/me/modules` (Phase 6);
`POST/GET /api/study-groups`, `POST /api/study-groups/:id/join`, `POST
/api/study-groups/:id/leave`, `GET /api/study-groups/:id/members` (Phase 7); `GET
/api/tutors`, `GET /api/tutors/:id`, `POST /api/tutoring-requests`, `PATCH
/api/tutoring-requests/:id`, `GET /api/tutoring-requests/my` (Phase 8); `POST /api/reviews`,
`GET /api/tutors/:id/reviews` (Phase 9).

## 8. Security

Never expose to the browser: `password`/password hash in any response, JWT signing secret,
database connection string.

Never run from the browser: password hashing, JWT verification, role enforcement. Missing or
expired tokens → 401 from `authMiddleware.js`. Cross-role access (student on tutor route or
vice versa) → 403 from `roleMiddleware.js`, with frontend `ProtectedRoute.tsx` redirecting to
the correct dashboard rather than just blocking.

## 9. Code standards

Small functions. Explicit types. No unrelated refactors. No over-engineering. `npm run lint`
and `npm run build` must exit with code 0 — zero lint warnings, clean TypeScript compilation.
Responsive from 360px to 1920px. Zero orphan records — every relation enforced through foreign
keys with appropriate cascade policies.

## 10. When in doubt

Keep it small. Use the relevant skill. Ask a focused question. Any change to scope, database
schemas, or sprint timelines gets a version bump and is documented, not silently changed.

Save a prompt. Get approval. Implement. Run checks. Share test steps.
