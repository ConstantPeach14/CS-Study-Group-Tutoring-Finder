const nodemailer = require('nodemailer');

function getSmtpConfiguration() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  const port = Number(SMTP_PORT);
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
  let parsedFrontendUrl;

  try {
    parsedFrontendUrl = new URL(frontendUrl);
  } catch {
    return null;
  }

  if (
    !SMTP_HOST ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !EMAIL_FROM ||
    !['http:', 'https:'].includes(parsedFrontendUrl.protocol)
  ) {
    return null;
  }

  return {
    host: SMTP_HOST,
    port,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    from: EMAIL_FROM,
  };
}

function isConfigured() {
  return getSmtpConfiguration() !== null;
}

async function sendPasswordResetEmail(to, resetUrl) {
  const config = getSmtpConfiguration();
  if (!config) {
    throw new Error('SMTP is not configured.');
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass,
    },
  });

  const safeResetUrl = resetUrl.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  await transporter.sendMail({
    from: config.from,
    to,
    subject: 'Reset your Study Group & Tutoring Finder password',
    text: `Use this link to reset your password. It expires in one hour and can only be used once:\n\n${resetUrl}\n\nIf you did not request a password reset, you can ignore this email.`,
    html: `<p>Use the link below to reset your password. It expires in one hour and can only be used once.</p><p><a href="${safeResetUrl}">Reset your password</a></p><p>If you did not request a password reset, you can ignore this email.</p>`,
  });
}

module.exports = {
  isConfigured,
  sendPasswordResetEmail,
};
