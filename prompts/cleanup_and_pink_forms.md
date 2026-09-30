# Implementation Prompt: Remove Automated Tutors & Courses + Visible Pink Forms & Profile Details

## Objective
1. **Clean Database Records**: Remove all automated test tutors and test accounts from Neon PostgreSQL while strictly preserving user **Jungkook Jeon** (`kookie@gmail.com`) and their created study group ("Science" / DTS97).
2. **Form Visibility Fix (Pink Forms)**: Update all input fields, textareas, and select dropdowns across the application—specifically in the Study Group Creation form (`/study-groups/create`) and all other forms—to have visible soft-pink backgrounds (`bg-[#fce7ec]`), crisp dusty pink borders (`border-[#d88299]`), high-contrast dark text (`text-[#0f172a]`), and clear placeholders (`placeholder-[#9c4f65]/60`).
3. **Profile Details & General Contrast Fix**: Fix washed-out / invisible details in student and tutor profiles (such as `/student/profile`, `/tutor/profile`, and `/tutors/[id]`), eliminating all instances where `text-white` was rendered on light backgrounds and enhancing them with clear, legible text and pink badge accents.

---

## 1. Database Cleanup Details

Execute a targeted SQL cleanup script against the Neon database:
- **Preserved Records**:
  - User: `jungkook jeon` (`email = 'kookie@gmail.com'`, `id = 68`).
  - Study Group: `Science` (`id = 8`, `course_code = 'DTS97'`, `created_by = 68`).
  - Associated memberships for Jungkook Jeon.
- **Removed Records**:
  - All test/automated `tutor_profiles` (e.g. Grace Hopper, Alan Turing generated during test runs).
  - All automated `tutoring_requests` linked to test users.
  - All automated/test users in `users` table (`WHERE email != 'kookie@gmail.com'`).
- **Safety**:
  - Run with foreign key cascades or child-to-parent deletion order (`tutoring_requests` -> `tutor_profiles` -> `study_group_members` -> `study_groups` -> `users`).
  - Verify that exactly 1 user (Jungkook Jeon) and 1 study group (Science) remain in the database.

---

## 2. Form Styling Updates (Making Forms Visibly Pink)

Update all form inputs across:
- `client/my-app/app/study-groups/create/page.tsx`
- `client/my-app/app/study-groups/[id]/edit/page.tsx`
- `client/my-app/app/tutor/profile/page.tsx`
- `client/my-app/app/tutors/[id]/page.tsx` (request tutoring modal)
- `client/my-app/app/study-groups/page.tsx` (search input and filter selects)
- `client/my-app/app/tutors/page.tsx` (search input)
- `client/my-app/app/login/page.tsx` & `client/my-app/app/register/page.tsx`

### Form Input Design Token:
- **Background**: Soft light pink tint `bg-[#fce7ec]` (eliminating white/grey invisible inputs)
- **Border**: Prominent dusty pink `border-[#d88299]` (or `border-[#e89aae]`)
- **Text**: Deep dark slate `text-[#0f172a]` (ensuring typed characters are 100% visible and sharp)
- **Placeholder**: Muted dusty pink `placeholder-[#9c4f65]/60`
- **Focus State**: `focus:ring-2 focus:ring-[#d88299] focus:border-[#d88299] focus:outline-hidden`
- **Labels & Headings**: Bold dark slate `text-[#0f172a]` / `text-[#334155]` with dusty pink required asterisks (`text-[#d88299]`)

---

## 3. Profile Details Visibility Fix

### A. Student Profile (`client/my-app/app/student/profile/page.tsx`)
- Replace washed-out `text-white` on name, surname, email, and created_at with bold, crisp `text-[#0f172a]`.
- Convert detail card boxes to soft pink cards (`bg-[#fce7ec] border border-[#e89aae]`) with dusty pink icons (`text-[#d88299]`) and deep dusty pink labels (`text-[#9c4f65]`).
- Ensure profile title and verified badges are crystal clear.

### B. Tutor Profile & Public View (`client/my-app/app/tutor/profile/page.tsx`, `client/my-app/app/tutors/[id]/page.tsx`)
- Fix headings (`About the Tutor`, `Courses & Subjects`, `Academic Credentials`, `Verification Status`) by changing `text-white` to `text-[#0f172a]`.
- Replace definition text (`role`, `created_at`) with `text-[#0f172a]`.
- Ensure all form inputs in tutor profile editing use the visible pink styling.

---

## 4. Verification & Quality Gates

1. Run Database Inspection Script to confirm:
   - Exactly 1 user remains: "Jungkook Jeon".
   - Zero automated test tutors in `tutor_profiles`.
   - Exactly 1 study group remains: "Science" (DTS97).
2. Run `npm.cmd run lint` in `client/my-app` — zero errors, zero warnings.
3. Run `npm.cmd run build` in `client/my-app` — clean Turbopack build across all routes.
4. Verify in browser:
   - Creating a study group shows clear pink input boxes with readable dark typed text.
   - Profile pages show prominent, readable user details without washed-out text.
   - Tutors page only shows the user's tutor profile and no test fixtures.
