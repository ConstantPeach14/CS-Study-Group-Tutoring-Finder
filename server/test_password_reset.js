const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { test, beforeEach } = require('node:test');

let users;
let resetTokens;
let sentEmails;
let nextTokenId;
let smtpConfigured;
let queryCount;

function resetState() {
  users = [{
    id: 42,
    name: 'Test',
    surname: 'Account',
    email: 'existing@university.edu',
    role: 'student',
    password: bcrypt.hashSync('OldPass123!', 10),
    created_at: new Date(),
  }];
  resetTokens = [];
  sentEmails = [];
  nextTokenId = 1;
  smtpConfigured = true;
  queryCount = 0;
}

async function databaseQuery(sql, params = []) {
  queryCount += 1;

  if (sql.includes('WITH matched_user AS MATERIALIZED')) {
    const user = users.find((entry) => entry.email.toLowerCase() === params[0]);
    if (!user) return { rows: [], rowCount: 0 };

    resetTokens
      .filter((entry) => entry.user_id === user.id && !entry.used_at)
      .forEach((entry) => {
        entry.used_at = new Date();
      });

    resetTokens.push({
      id: nextTokenId++,
      user_id: user.id,
      token_hash: params[1],
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      used_at: null,
      created_at: new Date(),
    });
    return { rows: [{ id: user.id, email: user.email }], rowCount: 1 };
  }

  if (sql.includes('FROM users WHERE LOWER(email) = $1')) {
    const user = users.find((entry) => entry.email.toLowerCase() === params[0]);
    return {
      rows: user ? [{ ...user }] : [],
      rowCount: user ? 1 : 0,
    };
  }

  if (sql.includes('UPDATE password_reset_tokens')) {
    const token = resetTokens.find((entry) => entry.token_hash === params[0] && !entry.used_at);
    if (token) token.used_at = new Date();
    return { rows: [], rowCount: token ? 1 : 0 };
  }

  throw new Error(`Unexpected database query in test: ${sql}`);
}

function makeTransactionClient() {
  let workingUsers;
  let workingTokens;

  return {
    async query(sql, params = []) {
      if (sql === 'BEGIN') {
        workingUsers = users.map((user) => ({ ...user }));
        workingTokens = resetTokens.map((token) => ({ ...token }));
        return { rows: [], rowCount: 0 };
      }
      if (sql === 'ROLLBACK') {
        workingUsers = undefined;
        workingTokens = undefined;
        return { rows: [], rowCount: 0 };
      }
      if (sql === 'COMMIT') {
        users = workingUsers;
        resetTokens = workingTokens;
        workingUsers = undefined;
        workingTokens = undefined;
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes('UPDATE password_reset_tokens') && sql.includes('RETURNING user_id')) {
        const token = workingTokens.find((entry) =>
          entry.token_hash === params[0] &&
          !entry.used_at &&
          entry.expires_at.getTime() > Date.now()
        );
        if (!token) return { rows: [], rowCount: 0 };
        token.used_at = new Date();
        return { rows: [{ user_id: token.user_id }], rowCount: 1 };
      }
      if (sql.startsWith('UPDATE users SET password')) {
        const user = workingUsers.find((entry) => entry.id === params[1]);
        if (!user) return { rows: [], rowCount: 0 };
        user.password = params[0];
        return { rows: [], rowCount: 1 };
      }
      throw new Error(`Unexpected transaction query in test: ${sql}`);
    },
    release() {},
  };
}

const databaseModulePath = require.resolve('./db/database');
const emailServicePath = require.resolve('./services/emailService');
require.cache[databaseModulePath] = {
  id: databaseModulePath,
  filename: databaseModulePath,
  loaded: true,
  exports: {
    query: databaseQuery,
    pool: { connect: async () => makeTransactionClient() },
  },
};
require.cache[emailServicePath] = {
  id: emailServicePath,
  filename: emailServicePath,
  loaded: true,
  exports: {
    isConfigured: () => smtpConfigured,
    sendPasswordResetEmail: async (to, url) => {
      sentEmails.push({ to, url });
    },
  },
};

const { requestPasswordReset, resetPassword } = require('./controllers/passwordResetController');
const { login } = require('./controllers/authController');

function makeResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function requestReset(email) {
  const response = makeResponse();
  await requestPasswordReset({ body: { email } }, response);
  await new Promise((resolve) => setImmediate(resolve));
  return response;
}

async function resetWith(response, password = 'NewPass456!') {
  const token = new URL(response.url).searchParams.get('token');
  const result = makeResponse();
  await resetPassword({
    body: { token, password, confirmPassword: password },
  }, result);
  return { token, response: result };
}

beforeEach(resetState);

test('forgot-password response is generic for known and unknown addresses', async () => {
  const known = await requestReset(' EXISTING@University.edu ');
  const unknown = await requestReset('missing@university.edu');

  assert.equal(known.statusCode, 200);
  assert.deepEqual(known.body, unknown.body);
  assert.match(known.body.message, /If an account exists/);
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, 'existing@university.edu');
  assert.equal(JSON.stringify(known.body).includes('token'), false);
});

test('both password-reset API routes are registered', () => {
  const routes = require('./routes/authRoutes').stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);
  assert.ok(routes.includes('/forgot-password'));
  assert.ok(routes.includes('/reset-password'));
});

test('reset token is stored as a digest, expires in one hour, and works only once', async () => {
  const oldLogin = makeResponse();
  await login({ body: { email: 'existing@university.edu', password: 'OldPass123!' } }, oldLogin);
  assert.equal(oldLogin.statusCode, 200);

  const request = await requestReset('existing@university.edu');
  const rawToken = new URL(sentEmails[0].url).searchParams.get('token');
  const storedToken = resetTokens[0];

  assert.equal(request.statusCode, 200);
  assert.equal(rawToken.length > 40, true);
  assert.notEqual(storedToken.token_hash, rawToken);
  assert.match(storedToken.token_hash, /^[a-f0-9]{64}$/);
  assert.equal(storedToken.token_hash, crypto.createHash('sha256').update(rawToken).digest('hex'));
  assert.ok(Math.abs(storedToken.expires_at.getTime() - Date.now() - 60 * 60 * 1000) < 1000);

  const result = await resetWith(sentEmails[0]);
  assert.equal(result.response.statusCode, 200);
  assert.match(result.response.body.message, /reset successfully/i);
  assert.equal(await bcrypt.compare('NewPass456!', users[0].password), true);
  assert.equal(await bcrypt.compare('OldPass123!', users[0].password), false);

  const newLogin = makeResponse();
  await login({ body: { email: 'existing@university.edu', password: 'NewPass456!' } }, newLogin);
  assert.equal(newLogin.statusCode, 200);

  const rejectedOldLogin = makeResponse();
  await login({ body: { email: 'existing@university.edu', password: 'OldPass123!' } }, rejectedOldLogin);
  assert.equal(rejectedOldLogin.statusCode, 401);

  const reuse = makeResponse();
  await resetPassword({
    body: { token: result.token, password: 'AnotherPass1!', confirmPassword: 'AnotherPass1!' },
  }, reuse);
  assert.equal(reuse.statusCode, 400);
});

test('issuing a new reset link invalidates the earlier link', async () => {
  await requestReset('existing@university.edu');
  const previousToken = sentEmails[0].url;
  await requestReset('existing@university.edu');

  assert.ok(resetTokens[0].used_at);
  const oldLink = await resetWith({ url: previousToken });
  assert.equal(oldLink.response.statusCode, 400);
});

test('expired tokens and invalid new passwords are rejected', async () => {
  const request = await requestReset('existing@university.edu');
  resetTokens[0].expires_at = new Date(Date.now() - 1000);

  const expired = await resetWith(sentEmails[0]);
  assert.equal(expired.response.statusCode, 400);

  const mismatch = makeResponse();
  await resetPassword({
    body: { token: expired.token, password: 'NewPass456!', confirmPassword: 'Different1!' },
  }, mismatch);
  assert.equal(mismatch.statusCode, 400);

  const tooShort = makeResponse();
  await resetPassword({
    body: { token: expired.token, password: '12345', confirmPassword: '12345' },
  }, tooShort);
  assert.equal(tooShort.statusCode, 400);
  assert.equal(request.statusCode, 200);
});

test('missing SMTP configuration is reported before looking up an email', async () => {
  smtpConfigured = false;
  const response = await requestReset('existing@university.edu');

  assert.equal(response.statusCode, 503);
  assert.match(response.body.error, /not configured/i);
  assert.equal(queryCount, 0);
  assert.equal(sentEmails.length, 0);
});

test('a failed email delivery invalidates the undisclosed token', async () => {
  const emailModule = require('./services/emailService');
  emailModule.sendPasswordResetEmail = async () => {
    throw new Error('SMTP failure includes no token details');
  };

  const response = await requestReset('existing@university.edu');
  assert.equal(response.statusCode, 200);
  assert.match(response.body.message, /If an account exists/);
  assert.ok(resetTokens[0].used_at);
});
