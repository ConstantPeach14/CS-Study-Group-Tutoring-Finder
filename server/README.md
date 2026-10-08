# Backend configuration

Copy `.env.example` to `.env` and configure the existing PostgreSQL connection and JWT
secret. Never commit `.env` or place its values in frontend configuration.

## Password reset email

Password recovery uses SMTP through Nodemailer. Configure these server-side variables:

- `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE` (`true` for implicit TLS, otherwise `false`)
- `SMTP_USER` and `SMTP_PASS`
- `EMAIL_FROM`, the sender address accepted by your SMTP provider
- `FRONTEND_URL`, the base URL used to create reset links (defaults to `CLIENT_URL`, then
  `http://localhost:3000`)

Without complete SMTP configuration, reset requests return a generic service-configuration
error and no email is sent. Once configured, valid reset requests receive a one-hour,
single-use reset link. The API does not disclose whether an account exists.

## Database migration

After setting `DATABASE_URL`, run `npm run db:init-password-reset` from this directory.
This explicitly applies the idempotent `db/schema_password_reset.sql` migration. The API
does not change the database schema at startup.
