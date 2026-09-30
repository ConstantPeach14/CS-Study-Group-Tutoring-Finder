# Implementation Prompt: Phase 4 — Sprint 4 (Tutor Finder & Visual Theme Update)

## Objective
Implement Phase 4 — Sprint 4: Tutor Finder for the Study Group & Tutoring Finder application. This empowers university students to discover, search, filter, and request verified peer tutors across courses, while enabling tutors to maintain detailed academic profiles and manage incoming tutoring requests. Additionally, apply a project-wide visual theme update to a cohesive **Dark Grey + Dusty Pink** palette.

---

## 1. Database Schema Specifications

Create two new PostgreSQL tables in Neon PostgreSQL with foreign keys referencing `users(id)`:

```sql
-- 1. tutor_profiles table
CREATE TABLE IF NOT EXISTS tutor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    subjects VARCHAR(255) NOT NULL,
    course_codes VARCHAR(255) NOT NULL,
    qualifications VARCHAR(255),
    availability VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutor_profiles_user_id ON tutor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_course_codes ON tutor_profiles(LOWER(course_codes));

-- 2. tutoring_requests table
CREATE TABLE IF NOT EXISTS tutoring_requests (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_code VARCHAR(50) NOT NULL,
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tutoring_requests_student ON tutoring_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_requests_tutor ON tutoring_requests(tutor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_tutoring_request 
ON tutoring_requests(student_id, tutor_id) 
WHERE status = 'pending';
```

---

## 2. Backend REST API Endpoints

### File: `server/routes/tutorRoutes.js` (mounted at `/api/tutors`)
1. **`GET /api/tutors`** (Public / Optional Auth):
   - Query params: `search` / `q`, `course_code`, `subject`
   - Returns list of verified tutors with profile information and creator metadata.
2. **`GET /api/tutors/:id`** (Public / Optional Auth):
   - Returns individual tutor profile, credentials, subjects, availability, and if requester is student, existing request status (`my_request`).
3. **`GET /api/tutors/me`** (Protected: `authMiddleware`, `requireRole('tutor')`):
   - Returns authenticated tutor's own profile.
4. **`PUT /api/tutors/me`** (Protected: `authMiddleware`, `requireRole('tutor')`):
   - Creates or updates (upsert) the tutor's profile (`bio`, `subjects`, `course_codes`, `qualifications`, `availability`).

### File: `server/routes/tutoringRequestRoutes.js` (mounted at `/api/tutoring-requests`)
1. **`POST /api/tutoring-requests`** (Protected: `authMiddleware`, `requireRole('student')`):
   - Body: `{ tutor_id, course_code, message }`
   - Prevents self-requesting and prevents duplicate pending requests (409 Conflict).
2. **`GET /api/tutoring-requests/my`** (Protected: `authMiddleware`, `requireRole('student')`):
   - Returns requests sent by the current student.
3. **`GET /api/tutoring-requests/received`** (Protected: `authMiddleware`, `requireRole('tutor')`):
   - Returns requests received by the current tutor.
4. **`PATCH /api/tutoring-requests/:id`** (Protected: `authMiddleware`):
   - Tutors can accept or decline requests directed to them.
   - Students can cancel their own pending requests.
   - Prevents unauthorized cross-role or cross-user modifications (403 Forbidden).

---

## 3. Project-Wide Visual Theme: Dark Grey + Dusty Pink

1. **Tokens (`client/my-app/app/globals.css`)**:
   - Backgrounds: Dark charcoal `#0f141c`, Card surfaces `#171f2c`, Card subtle `#1e293b`.
   - Accent: Dusty Pink `#d47b93`, Hover `#bf677f`, Subtle `#2d1b25`, Border `#e293a9`.
   - Text: Primary `#f8fafc`, Secondary `#cbd5e1`, Muted `#94a3b8`.
   - Map existing utility classes (`bg-purple`, `text-purple`, `bg-pink`, `text-light-green`) to the cohesive palette to ensure zero regressions in existing Phase 1–3 pages.
2. **Components**:
   - Navbar: Dark charcoal background, dusty pink brand accents and active indicators, with "Find Tutors" link added.
   - Footer: Dark charcoal background, complementary borders and soft pink highlights.
   - Layout: Dark background on body.

---

## 4. Frontend Tutor Finder Pages

1. **Tutors Catalog (`app/tutors/page.tsx`)**:
   - Header with "Find a Tutor" title, search bar, course code filter chips, availability filters.
   - Responsive grid of Tutor cards showing avatar, name, verified badge, subjects, course codes, availability, and "View Profile" link.
2. **Tutor Detail (`app/tutors/[id]/page.tsx`)**:
   - Detailed bio, credentials, subjects, schedule.
   - Contextual Request button: "Log in to Request" (logged out), "Request Tutoring" (modal/form for students), "Request Pending / Accepted / Declined" indicators, and self-profile edit prompt for tutors.
3. **Tutor Profile Edit (`app/tutor/profile/page.tsx`)**:
   - Allows tutors to update their bio, subjects, course codes, qualifications, and availability with instant validation and saving.
4. **Dashboard Integration**:
   - Student dashboard: Shows active tutoring requests and quick link to browse tutors.
   - Tutor dashboard: Shows incoming student requests with Accept / Decline action buttons.

---

## 5. Testing & Verification

1. Backend automated tests covering tutor profile upsert, unauthorized access rejection, search, request creation, duplicate prevention, and accept/decline flows.
2. Regression checks for Phase 1 & 2 (12 tests) and Sprint 3 (19 tests).
3. TypeScript check & Next.js production build (`npm run build`).
4. ESLint verification (`npm run lint`).
