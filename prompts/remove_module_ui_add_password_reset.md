# Remove Module Directory UI and Add Password Recovery

## Scope and confirmed project state

Implement the two user-requested changes without altering unrelated functionality:

1. Remove the Course/Module Directory and course/module enrollment experience from the
   frontend.
2. Add a secure forgot-password/reset-password flow integrated with the existing JWT and
   bcrypt authentication system.

Inspected before implementation:

- Login is `client/my-app/app/login/page.tsx`; registration is
  `client/my-app/app/register/page.tsx`; shared browser auth is
  `client/my-app/context/AuthContext.tsx`.
- API auth is implemented in `server/controllers/authController.js` and
  `server/routes/authRoutes.js`. It normalizes email lookups, hashes passwords with
  bcryptjs (10 rounds), and currently accepts passwords of at least six characters.
- Database access uses the existing Neon PostgreSQL pool in `server/db/database.js`.
- The current working tree already has unrelated edits in
  `server/routes/tutorRoutes.js`, `server/routes/tutoringRequestRoutes.js`,
  `server/routes/userRoutes.js`, and `server/server.js`; preserve these changes.
- Read-only inspection of the configured PostgreSQL database confirmed the current
  `users` table fields (`id`, `name`, `surname`, `email`, `password`, `role`,
  `created_at`) and the existing module/tutor/group-related tables. No password-reset
  token table currently exists. Do not change/delete users or existing records.
- No email provider or mail dependency is present, and the server environment currently
  defines only `PORT`, `CLIENT_URL`, `DATABASE_URL`, and `JWT_SECRET` (values are private
  and must not be printed or copied).
- Current module-directory pages are present at
  `client/my-app/app/modules/page.tsx` and `client/my-app/app/modules/[id]/page.tsx`.
  Directory links, enrollment state/API calls, and module cards also exist in both
  dashboards. Marketing copy in the homepage, About page, and Footer describes course or
  module discovery.

## Module-directory removal

- Delete the two frontend `/modules` page files so neither `/modules` nor `/modules/[id]`
  remains a frontend route.
- Remove module-directory navigation, enrollment/module cards, module-fetch and
  unenrollment state/actions, module-only imports and types from both student and tutor
  dashboards.
- Search all frontend source (excluding generated/dependency directories) for `/modules`
  links and directory/enrollment wording. Remove or revise directory-related content in
  the homepage, About page, Footer, Navbar, dashboards, and any other affected user-facing
  surface.
- Preserve the student and tutor dashboards, profiles, group management, tutor discovery,
  tutoring requests, authentication, and existing theme.
- Preserve course-code information and inputs where necessary to existing Study Group and
  Tutor Finder/tutoring workflows. Do not remove or alter their backend APIs, stored data,
  or schemas.
- Do not clean up backend module artifacts or modify unrelated backend routes for this
  removal.

## Password recovery flow

### Frontend

- Add a “Forgot Password?” link on Login to `/forgot-password`.
- Add `/forgot-password` with email input, submit state, clear success/error feedback,
  and a link back to Login. On successful API submission show the same generic response
  for every address:
  “If an account exists with this email address, you will receive instructions to reset
  your password.”
- Add `/reset-password` to accept the raw token from the reset URL query string, collect
  new password and confirmation, validate required fields, matching values, and the
  existing six-character minimum, and submit to the reset API.
- On successful reset, show the required success message and a link to Login. Keep the
  existing grey/dusty-pink visual theme and do not change existing login/register behavior.

### API and token lifecycle

- Add `POST /api/auth/forgot-password` and `POST /api/auth/reset-password`, mounted through
  the existing auth router.
- Normalize and validate the submitted email, but never reveal whether it exists. Return
  the same generic successful response for unknown and known addresses when the service
  is configured. Do not return a raw reset token in any API response or log it.
- Generate a cryptographically secure, high-entropy random token, store only its SHA-256
  digest, associate it with the user, expire it after one hour, and enforce single use.
- Add an idempotent database migration for a reset-token table with user foreign key and
  cascade-on-user-delete, unique token digest, expiration, used-at, and created-at fields.
  Provide an explicit migration script using the existing DB pool; do not auto-run schema
  changes at server startup.
- During password reset, atomically claim a valid, unused, unexpired token and update the
  user's password hash in one transaction. Reject missing/invalid/expired/used tokens
  with a generic invalid/expired-token response. Hash the new password with the existing
  bcryptjs 10-round mechanism. Never persist or log plaintext passwords or raw tokens.
- Ensure prior active reset tokens for the account cannot remain usable after issuing a
  new one. Handle failed delivery without leaving an undisclosed usable token.

### Email configuration

- There is no configured mail provider. Integrate a single conventional SMTP transport
  using Nodemailer; add it to the server dependency manifest/lockfile.
- Read all configuration only from server environment variables. Document and provide
  blank placeholders for `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`,
  `SMTP_PASS`, `EMAIL_FROM`, and `FRONTEND_URL` in a server environment example and
  documentation. Never commit credentials; never use fake credentials.
- Require complete SMTP configuration before sending. If unavailable, return a
  configuration/service-unavailable response that does not vary based on account
  existence and explain the required setup in documentation. Do not claim an email was
  delivered when SMTP is unconfigured.
- Build reset links from the configured frontend URL. Do not log the link or token.

## Tests and verification

- Add safe targeted tests for generic known/unknown-email responses, token digest-only
  storage, expiration, single-use behavior, password hashing/replacement, and invalid
  password/token rejection. Use a mocked/test database and mail transport rather than
  deleting or changing existing user records.
- Run frontend lint/build and backend syntax/tests relevant to auth. Confirm the App
  Router no longer lists `/modules` routes and does list `/forgot-password` and
  `/reset-password`.
- Search frontend source to confirm no `/modules` links, directory navigation, course
  enrollment cards/sections, or module-directory wording remains. Confirm group/tutor
  course-code functionality remains.
- If SMTP credentials are unavailable, explicitly report that real email delivery was not
  integration-tested and state the configuration still required.
- Review the final diff and leave pre-existing unrelated backend edits untouched.
