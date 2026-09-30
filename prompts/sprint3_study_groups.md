# Implementation Prompt: Phase 3 — Sprint 3 (Study Groups)

## Objective
Implement Phase 3 — Sprint 3: Study Groups for the Study Group & Tutoring Finder application. This enables authenticated students and tutors to create, search, filter, view, join, leave, edit, and delete module-centric study groups while preserving existing authentication and user roles.

---

## 1. Database Schema Specifications

Create two new tables in Neon PostgreSQL with foreign keys referencing `users(id)`:

```sql
-- 1. study_groups table
CREATE TABLE IF NOT EXISTS study_groups (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    meeting_time VARCHAR(255) NOT NULL,
    max_members INT NOT NULL DEFAULT 10 CHECK (max_members >= 2),
    creator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_study_groups_course_code ON study_groups(LOWER(course_code));
CREATE INDEX IF NOT EXISTS idx_study_groups_creator_id ON study_groups(creator_id);

-- 2. study_group_members table
CREATE TABLE IF NOT EXISTS study_group_members (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_group_user UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sgm_group_id ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_sgm_user_id ON study_group_members(user_id);
```

---

## 2. Backend REST API Endpoints (`server/`)

### File: `server/routes/studyGroupRoutes.js`
Mount at `/api/study-groups` in `server/server.js`.

### Endpoints:
1. **`GET /api/study-groups`** (Public / Optional Auth):
   - Query params: `q` (search title, course code, description), `course_code` (filter by exact or partial course code), `status` (`all`, `open`, `full`).
   - Returns list of study groups with:
     - `id`, `title`, `course_code`, `description`, `location`, `meeting_time`, `max_members`, `created_at`
     - Creator metadata: `creator_name`, `creator_surname`, `creator_role`
     - `member_count`: current total members
     - `is_full`: boolean (`member_count >= max_members`)
     - `is_member`: boolean (whether requesting user is enrolled, if auth token provided)
     - `is_creator`: boolean (whether requesting user is the creator, if auth token provided)

2. **`GET /api/study-groups/:id`** (Public / Optional Auth):
   - Returns single group details, creator details, member count, and full list of members (`user_id`, `name`, `surname`, `role`, `joined_at`), plus user's membership status.

3. **`GET /api/study-groups/user/my`** (Protected: `authMiddleware`):
   - Returns study groups created by or joined by the authenticated user.

4. **`POST /api/study-groups`** (Protected: `authMiddleware`):
   - Request Body: `{ title, course_code, description, location, meeting_time, max_members }`
   - Validation: All required fields present, `max_members >= 2`, `title` length >= 3.
   - Transaction/Workflow:
     1. Insert into `study_groups` with `creator_id = req.user.id`.
     2. Insert creator into `study_group_members` with `role = 'creator'`.
     3. Return created study group.

5. **`PUT /api/study-groups/:id`** (Protected: `authMiddleware`):
   - Only group creator (`req.user.id === group.creator_id`) can update.
   - Update `title`, `course_code`, `description`, `location`, `meeting_time`, `max_members`.
   - Ensure new `max_members` is not less than the current member count.

6. **`DELETE /api/study-groups/:id`** (Protected: `authMiddleware`):
   - Only group creator (`req.user.id === group.creator_id`) can delete.
   - Cascades deletion to `study_group_members`.

7. **`POST /api/study-groups/:id/join`** (Protected: `authMiddleware`):
   - Checks:
     - Group exists.
     - User is NOT already a member (`UNIQUE` constraint / 409 Conflict if already joined).
     - Group is NOT full (`member_count < max_members` / 400 Bad Request if full).
   - Inserts member into `study_group_members` (`role = 'member'`).
   - Returns success message and updated member count.

8. **`POST /api/study-groups/:id/leave`** (Protected: `authMiddleware`):
   - Checks:
     - Group exists.
     - User is a member of the group.
     - If user is the creator, prevent leaving directly (require deleting or transferring, or explain creator must delete the group).
   - Removes row from `study_group_members`.

---

## 3. Frontend Implementation (`client/my-app/`)

### 1. Navigation Updates (`components/Navbar.tsx`)
- Add a "Study Groups" navigation link accessible to all users (highlighted when active).

### 2. Study Groups Catalog Page (`app/study-groups/page.tsx`)
- Header with title, subtitle, and "Create Study Group" button (linking to `/study-groups/create` or opening modal).
- Interactive search bar with debounce / instantaneous filter for course code or title.
- Filter chips: Course Code filter, Status filter (All, Open, Full), and "My Groups" quick toggle (when logged in).
- Grid of Study Group cards:
  - Course code badge (e.g., `CSC101`), title, description snippet.
  - Meeting location & schedule icons.
  - Member count badge (`3 / 8 members` with visual progress bar).
  - Quick action buttons: "View Details", "Join Group" (if not member), "Joined" / "Leave" (if member), "Manage" (if creator).
  - Empty state when no study groups match the filter.

### 3. Study Group Detail Page (`app/study-groups/[id]/page.tsx`)
- Breadcrumbs back to `/study-groups`.
- Detailed information card:
  - Full title, course code, status badge (Open / Full).
  - Description, location (physical spot or link), meeting schedule.
  - Creator card with avatar, name, and role.
  - Capacity progress bar.
- Members List card:
  - Displays all current members with avatar initials, name, role (`Creator` vs `Member`), and joined date.
- Contextual action bar:
  - If user is creator: "Edit Group" and "Delete Group" buttons.
  - If user is enrolled member (non-creator): "Leave Group" button with confirmation.
  - If user is not member and not full: "Join Group" button.
  - If not logged in: "Log in to Join" button.

### 4. Create & Edit Group Flow (`app/study-groups/create/page.tsx` & `/app/study-groups/[id]/edit/page.tsx` or modal)
- Protected by `ProtectedRoute` (user must be authenticated).
- Accessible form with validation for:
  - Title (e.g., "Algorithms & Data Structures Study Jam")
  - Course / Module Code (e.g., "CSC101", "INF201", "MTH104")
  - Meeting Schedule (e.g., "Tuesdays & Thursdays, 16:00 - 18:00")
  - Location (e.g., "Main Campus Library Room 3B" or "Discord / Google Meet")
  - Max Members (number picker between 2 and 50)
  - Detailed Description of goals and topics.
- Toast / error message handling for network or validation failures.

### 5. Dashboard Integration (`app/student/dashboard/page.tsx` & `app/tutor/dashboard/page.tsx`)
- Hydrate the "My Study Groups" metric card on the student dashboard with actual count from `/api/study-groups/user/my`.
- Display a list of the user's active study groups with quick links.
- Link the "Find and join study groups" action button to `/study-groups`.

---

## 4. Security & Quality Assurance Standards

1. Parameterized SQL queries for all database operations.
2. Route protection:
   - Server-side JWT validation on all state-mutating actions (create, edit, delete, join, leave).
   - 401 Unauthorized for unauthenticated requests.
   - 403 Forbidden when non-creators attempt to edit or delete groups.
   - 409 Conflict when attempting to join a group already joined.
   - 400 Bad Request when attempting to join a full group.
3. Design System Compliance:
   - Consistency with existing visual tokens (`bg-purple`, `bg-purple-hover`, `text-purple`, `text-light-green`, `border-slate-200`, `bg-slate-50`, `rounded-xl`, `shadow-xs`).
   - Zero occurrences of raw unstyled elements or placeholder text.
   - Mobile responsiveness from 360px to 1920px.
4. Clean code verification:
   - TypeScript compiles cleanly with zero errors.
   - Automated test runner verifying all endpoint actions.
