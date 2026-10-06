# Phase 6 Correction — Module Directory Removal & Generated Tutor Cleanup

## Scope confirmed and approved by user.

### A. Files to delete
- client/my-app/app/modules/page.tsx
- client/my-app/app/modules/[id]/page.tsx
- server/routes/moduleRoutes.js
- server/controllers/moduleController.js

### B. Files to modify
- server/server.js — remove moduleRoutes import and mount
- server/routes/tutorRoutes.js — remove moduleController import and /modules POST route
- client/my-app/components/Navbar.tsx — remove all /modules links and Library icon usage
- client/my-app/app/student/dashboard/page.tsx — remove module enrollment sections
- client/my-app/app/tutor/dashboard/page.tsx — remove teaching modules sections
- server/test_runner.js — add NODE_ENV guard
- server/test_study_groups.js — add NODE_ENV guard
- server/test_tutor_finder.js — add NODE_ENV guard
- server/scripts/verify_phase5.js — add NODE_ENV guard

### C. Database cleanup
Delete generated test users (IDs: 71,72,73,74,75,76,77,78,79,80,81,83,84,85,86,87,90,91)
and all their dependent records (tutoring_requests, study_group_members, tutor_profiles).
Keep IDs 68, 69, 70, 82.
