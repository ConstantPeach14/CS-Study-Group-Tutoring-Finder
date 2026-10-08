const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool, query } = require('../db/database');
const emailService = require('../services/emailService');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_REQUEST_MESSAGE =
  'If an account exists with this email address, you will receive instructions to reset your password.';

async function deliverResetEmail(email, resetUrl, tokenHash) {
  try {
    await emailService.sendPasswordResetEmail(email, resetUrl);
  } catch {
    console.error('Password reset email delivery failed.');
    try {
      await query(
        `UPDATE password_reset_tokens
         SET used_at = CURRENT_TIMESTAMP
         WHERE token_hash = $1 AND used_at IS NULL`,
        [tokenHash]
      );
    } catch {
      console.error('Could not invalidate an undelivered password reset token.');
    }
  }
}

const requestPasswordReset = async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (!emailService.isConfigured()) {
    return res.status(503).json({
      error: 'Password reset email is not configured. Please contact the administrator.',
    });
  }

  try {
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenResult = await query(
      `WITH matched_user AS MATERIALIZED (
         SELECT id, email FROM users WHERE LOWER(email) = $1
       ),
       invalidated AS (
         UPDATE password_reset_tokens AS existing
         SET used_at = CURRENT_TIMESTAMP
         FROM matched_user
         WHERE existing.user_id = matched_user.id AND existing.used_at IS NULL
       ),
       inserted AS (
         INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         SELECT id, $2, CURRENT_TIMESTAMP + INTERVAL '1 hour'
         FROM matched_user
         RETURNING user_id
       )
       SELECT matched_user.id, matched_user.email
       FROM matched_user
       JOIN inserted ON inserted.user_id = matched_user.id`,
      [email, tokenHash]
    );
    const user = tokenResult.rows[0];

    if (!user) {
      return res.status(200).json({ success: true, message: RESET_REQUEST_MESSAGE });
    }

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = new URL('/reset-password', frontendUrl);
    resetUrl.searchParams.set('token', rawToken);

    const response = res.status(200).json({ success: true, message: RESET_REQUEST_MESSAGE });
    setImmediate(() => {
      void deliverResetEmail(user.email, resetUrl.toString(), tokenHash);
    });
    return response;
  } catch {
    console.error('Password reset request failed.');
    return res.status(500).json({ error: 'Unable to process the password reset request.' });
  }
};

const resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body || {};

  if (typeof token !== 'string' || !token || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Reset token and new password are required.' });
  }

  if (typeof confirmPassword !== 'string' || password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const passwordHash = await bcrypt.hash(password, 10);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const tokenResult = await client.query(
      `UPDATE password_reset_tokens
       SET used_at = CURRENT_TIMESTAMP
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > CURRENT_TIMESTAMP
       RETURNING user_id`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
    }

    const userId = tokenResult.rows[0].user_id;
    const updateResult = await client.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [passwordHash, userId]
    );

    if (updateResult.rowCount !== 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
    }

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in with your new password.',
    });
  } catch {
    try {
      await client.query('ROLLBACK');
    } catch {
      console.error('Password reset transaction rollback failed.');
    }
    console.error('Password reset failed.');
    return res.status(500).json({ error: 'Unable to reset the password. Please try again.' });
  } finally {
    client.release();
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
