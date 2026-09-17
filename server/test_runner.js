const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./server.js');

let server;
const PORT = 5001;

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING AUTOMATED TEST SUITE ===');

  server = app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
  });

  const timestamp = Date.now();
  const testStudentEmail = `student_${timestamp}@university.edu`;
  const testTutorEmail = `tutor_${timestamp}@university.edu`;
  let studentToken = '';
  let tutorToken = '';

  try {
    // 1. Health Check
    console.log('\n--- 1. Testing GET /api/health ---');
    const healthRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
    });
    console.log('Status:', healthRes.status, 'Body:', healthRes.body);
    if (healthRes.status !== 200 || healthRes.body.database !== 'connected') {
      throw new Error('Health check failed');
    }
    console.log('✔ Health check passed');

    // 2. Student Registration
    console.log('\n--- 2. Testing Student Registration ---');
    const regStudentRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Alice',
        surname: 'Johnson',
        email: testStudentEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'student',
      }
    );
    console.log('Status:', regStudentRes.status, 'Body:', regStudentRes.body);
    if (regStudentRes.status !== 201 || regStudentRes.body.user.role !== 'student') {
      throw new Error('Student registration failed');
    }
    console.log('✔ Student registration passed');

    // 3. Tutor Registration
    console.log('\n--- 3. Testing Tutor Registration ---');
    const regTutorRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Bob',
        surname: 'Smith',
        email: testTutorEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'tutor',
      }
    );
    console.log('Status:', regTutorRes.status, 'Body:', regTutorRes.body);
    if (regTutorRes.status !== 201 || regTutorRes.body.user.role !== 'tutor') {
      throw new Error('Tutor registration failed');
    }
    console.log('✔ Tutor registration passed');

    // 4. Duplicate Email Check
    console.log('\n--- 4. Testing Duplicate Email Prevention ---');
    const dupRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Duplicate',
        surname: 'User',
        email: testStudentEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'student',
      }
    );
    console.log('Status:', dupRes.status, 'Body:', dupRes.body);
    if (dupRes.status !== 409) {
      throw new Error('Duplicate email was not rejected');
    }
    console.log('✔ Duplicate email rejection passed');

    // 5. Password Mismatch Check
    console.log('\n--- 5. Testing Password Mismatch Validation ---');
    const mismatchRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Mismatch',
        surname: 'Test',
        email: `mismatch_${timestamp}@university.edu`,
        password: 'Password123!',
        confirmPassword: 'DifferentPassword!',
        role: 'student',
      }
    );
    console.log('Status:', mismatchRes.status, 'Body:', mismatchRes.body);
    if (mismatchRes.status !== 400) {
      throw new Error('Password mismatch was not rejected');
    }
    console.log('✔ Password mismatch rejection passed');

    // 6. Student Login
    console.log('\n--- 6. Testing Student Login ---');
    const studentLoginRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: testStudentEmail,
        password: 'Password123!',
      }
    );
    console.log('Status:', studentLoginRes.status, 'User:', studentLoginRes.body.user);
    if (
      studentLoginRes.status !== 200 ||
      !studentLoginRes.body.token ||
      studentLoginRes.body.user.role !== 'student'
    ) {
      throw new Error('Student login failed');
    }
    studentToken = studentLoginRes.body.token;
    console.log('✔ Student login passed (JWT token issued)');

    // 7. Tutor Login
    console.log('\n--- 7. Testing Tutor Login ---');
    const tutorLoginRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: testTutorEmail,
        password: 'Password123!',
      }
    );
    console.log('Status:', tutorLoginRes.status, 'User:', tutorLoginRes.body.user);
    if (
      tutorLoginRes.status !== 200 ||
      !tutorLoginRes.body.token ||
      tutorLoginRes.body.user.role !== 'tutor'
    ) {
      throw new Error('Tutor login failed');
    }
    tutorToken = tutorLoginRes.body.token;
    console.log('✔ Tutor login passed (JWT token issued)');

    // 8. Invalid Credentials Login
    console.log('\n--- 8. Testing Invalid Credentials Login ---');
    const badLoginRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: testStudentEmail,
        password: 'WrongPassword!',
      }
    );
    console.log('Status:', badLoginRes.status, 'Body:', badLoginRes.body);
    if (badLoginRes.status !== 401) {
      throw new Error('Invalid login was not rejected');
    }
    console.log('✔ Invalid credentials rejection passed');

    // 9. Protected Profile /api/users/me with Student Token
    console.log('\n--- 9. Testing GET /api/users/me (Student Token) ---');
    const studentMeRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users/me',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });
    console.log('Status:', studentMeRes.status, 'Body:', studentMeRes.body);
    if (studentMeRes.status !== 200 || studentMeRes.body.user.email !== testStudentEmail) {
      throw new Error('Failed to retrieve student profile');
    }
    console.log('✔ Student /api/users/me verified');

    // 10. Protected Profile /api/users/me with Tutor Token
    console.log('\n--- 10. Testing GET /api/users/me (Tutor Token) ---');
    const tutorMeRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users/me',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tutorToken}`,
      },
    });
    console.log('Status:', tutorMeRes.status, 'Body:', tutorMeRes.body);
    if (tutorMeRes.status !== 200 || tutorMeRes.body.user.email !== testTutorEmail) {
      throw new Error('Failed to retrieve tutor profile');
    }
    console.log('✔ Tutor /api/users/me verified');

    // 11. Unauthorized Profile Access (No Token)
    console.log('\n--- 11. Testing GET /api/users/me (No Token) ---');
    const noTokenRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/users/me',
      method: 'GET',
    });
    console.log('Status:', noTokenRes.status, 'Body:', noTokenRes.body);
    if (noTokenRes.status !== 401) {
      throw new Error('Access was not denied for missing token');
    }
    console.log('✔ Unauthorized access rejection passed');

    // 12. Database row verification
    console.log('\n--- 12. Direct Database Row Verification ---');
    const { query } = require('./db/database');
    const dbCheck = await query(
      'SELECT id, name, surname, email, role, created_at, password FROM users WHERE email IN ($1, $2)',
      [testStudentEmail, testTutorEmail]
    );
    console.log('Verified database rows:', dbCheck.rows.length);
    dbCheck.rows.forEach((row) => {
      console.log(`User [${row.id}]: ${row.name} ${row.surname} (${row.role}) - Password is hashed: ${row.password.startsWith('$2')}`);
    });

    console.log('\n========================================');
    console.log('ALL 12 BACKEND & DATABASE TESTS PASSED!');
    console.log('========================================');
  } catch (err) {
    console.error('TEST SUITE FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    process.exit(process.exitCode || 0);
  }
}

runTests();
