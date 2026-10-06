# Phase 6 — Module & Academic Course Directory

## Summary

Implement Phase 6 of the Study Group & Tutoring Finder platform: the centralized **Module & Academic Course Directory**. This ties all peer study groups and tutoring sessions strictly to verified university course and module codes (e.g., `CSC101`, `INF201`, `MTH104`), allowing students to enroll in courses and discover classmates and tutors per module.

---

## 1. Database Schema Additions (Neon PostgreSQL)

### File: `server/db/schema_modules.sql` & Migration Script `server/db/init_modules.js`

1. **`modules` Table**:
   ```sql
   CREATE TABLE IF NOT EXISTS modules (
       id SERIAL PRIMARY KEY,
       code VARCHAR(50) UNIQUE NOT NULL,
       name VARCHAR(150) NOT NULL,
       faculty VARCHAR(100) NOT NULL DEFAULT 'Computer Science & STEM',
       description TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX IF NOT EXISTS idx_modules_code ON modules(LOWER(code));
   CREATE INDEX IF NOT EXISTS idx_modules_faculty ON modules(faculty);
   ```

2. **`user_modules` Table**:
   ```sql
   CREATE TABLE IF NOT EXISTS user_modules (
       id SERIAL PRIMARY KEY,
       user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       module_id INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
       role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'tutor')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT uq_user_module UNIQUE (user_id, module_id)
   );

   CREATE INDEX IF NOT EXISTS idx_user_modules_user_id ON user_modules(user_id);
   CREATE INDEX IF NOT EXISTS idx_user_modules_module_id ON user_modules(module_id);
   ```

3. **Baseline Seed Modules**:
   Provide initial STEM & CS courses:
   - `CSC101`: Introduction to Computer Science & Programming
   - `CSC102`: Data Structures & Algorithms
   - `INF201`: Database Systems & Information Management
   - `MTH104`: Discrete Mathematics for Computing
   - `SWE301`: Software Engineering Principles
   - `NET202`: Computer Networks & Cloud Computing
   - `DTS97`: Science & Data Foundations

---

## 2. Backend REST API Endpoints (`server/routes/moduleRoutes.js`)

Mount route at `/api/modules`:

1. **`GET /api/modules`** (Public / Optional Auth):
   - Query params: `q` / `search` (matches `code` or `name` case-insensitively), `faculty`.
   - Returns array of modules including:
     - `id`, `code`, `name`, `faculty`, `description`
     - `student_count`: count of students enrolled
     - `tutor_count`: count of tutors qualified
     - `group_count`: count of active study groups for this module code
     - `is_enrolled`: boolean (if authenticated user is enrolled)

2. **`GET /api/modules/:id`** (Public / Optional Auth):
   - Returns module details with:
     - Active study groups matching this module's course code
     - Available tutors teaching this module
     - User enrollment status

3. **`POST /api/modules/enroll`** (Protected: `authMiddleware`):
   - Body: `{ module_id: number }`
   - Role defaults to `req.user.role` ('student' or 'tutor')
   - Inserts into `user_modules` (idempotent ON CONFLICT DO NOTHING)
   - Returns `{ success: true, message: 'Successfully enrolled in module.', module }`

4. **`POST /api/modules/unenroll`** (Protected: `authMiddleware`):
   - Body: `{ module_id: number }`
   - Removes row from `user_modules` for `req.user.id`
   - Returns `{ success: true, message: 'Successfully unenrolled from module.' }`

5. **`POST /api/tutors/modules`** (Protected: `authMiddleware`, `requireRole('tutor')`):
   - Body: `{ module_id: number }`
   - Inserts into `user_modules` with `role: 'tutor'`
   - Updates `tutor_profiles.course_codes` if needed to keep in sync

6. **`GET /api/users/me/modules`** (Protected: `authMiddleware`):
   - Returns all modules enrolled by the authenticated user with details (`id`, `code`, `name`, `faculty`, `role`, `joined_at`).

---

## 3. Frontend Views & Navigation (`client/my-app/`)

1. **Navbar Navigation (`client/my-app/components/Navbar.tsx`)**:
   - Add "Modules" navigation link to both Desktop and Mobile menus (`/modules`).

2. **Module Directory Page (`client/my-app/app/modules/page.tsx`)**:
   - Course directory with live search bar and faculty filter pills.
   - Course cards displaying course code badge, course name, faculty, counts (groups, tutors, students), and quick action buttons ("View Module", "Enroll" / "Teach").

3. **Module Detail Overview Page (`client/my-app/app/modules/[id]/page.tsx`)**:
   - Header with course code, name, faculty, and enrollment status badge.
   - Action controls: Enroll / Unenroll button for students, Add to Teaching List for tutors, "Create Study Group for this Module" button.
   - Tabs or dedicated sections for:
     - **Active Study Groups**: Cards with direct Join/View actions.
     - **Peer Tutors**: Cards with direct "Request Tutoring" action.
     - **Enrolled Classmates**: Count and peer connection info.

4. **Student Dashboard Integration (`client/my-app/app/student/dashboard/page.tsx`)**:
   - "My Enrolled Modules" section showing enrolled courses with quick jump to module groups and unenroll action.
   - Quick action to browse module directory.

5. **Tutor Dashboard Integration (`client/my-app/app/tutor/dashboard/page.tsx`)**:
   - "My Teaching Modules" section showing certified modules with quick links to students seeking help and module overview.

6. **Design & Theming**:
   - Strictly adhere to Light Grey (`#e8edf2`), Soft Cards (`#f1f4f8`), Dusty Pink (`#d88299` / `#fce7ec`), Dark Slate text (`#0f172a`), with zero green and zero unreadable white text on light backgrounds.

---

## 4. Verification & Testing

1. **Automated Test Script (`server/test_modules.js`)**:
   - Run tests covering:
     - Module listing and search (`GET /api/modules?q=CSC101`)
     - Student module enrollment and duplicate prevention (`POST /api/modules/enroll`)
     - Tutor module registration (`POST /api/tutors/modules`)
     - Active module retrieval (`GET /api/users/me/modules`)
     - Module unenrollment (`POST /api/modules/unenroll`)
     - Cascade deletion and foreign key integrity
2. **Quality Gates**:
   - `npm run lint` in `client/my-app` exits with 0 warnings/errors.
   - `npm run build` in `client/my-app` compiles all routes cleanly.
