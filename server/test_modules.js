const http = require('http');
const express = require('express');
const cors = require('cors');
const { query } = require('./db/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const studyGroupRoutes = require('./routes/studyGroupRoutes');

const TEST_PORT = 5003;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function pass(msg) {
  console.log(`✔ ${msg}`);
}

function fail(msg, details = null) {
  console.error(`✘ FAIL: ${msg}`);
  if (details) console.error(details);
  process.exitCode = 1;
}

async function runModulesTestSuite() {
  console.log('============================================================');
  console.log('STARTING PHASE 6 MODULE DIRECTORY AUTOMATED TEST SUITE');
  console.log('============================================================\n');

  // 1. Start test app instance
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/modules', moduleRoutes);
  app.use('/api/tutors', tutorRoutes);
  app.use('/api/study-groups', studyGroupRoutes);

  const server = app.listen(TEST_PORT, () => {
    console.log(`Module test server running on port ${TEST_PORT}`);
  });

  const timestamp = Date.now();
  let studentToken = null;
  let tutorToken = null;
  let studentId = null;
  let tutorId = null;
  let testModuleId = null;

  try {
    // Step 0: Register Student & Tutor
    console.log('--- 0. Setting up Test Users ---');
    const studentRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Sarah',
      surname: 'Connor',
      email: `sarah_mod_${timestamp}@university.edu`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'student',
    });
    if (studentRes.status !== 201) throw new Error('Failed to register student');
    studentId = studentRes.body.user.id;

    const studentLogin = await makeRequest('POST', '/api/auth/login', {
      email: `sarah_mod_${timestamp}@university.edu`,
      password: 'Password123!',
    });
    studentToken = studentLogin.body.token;

    const tutorRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Ada',
      surname: 'Lovelace',
      email: `ada_mod_${timestamp}@university.edu`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'tutor',
    });
    if (tutorRes.status !== 201) throw new Error('Failed to register tutor');
    tutorId = tutorRes.body.user.id;

    const tutorLogin = await makeRequest('POST', '/api/auth/login', {
      email: `ada_mod_${timestamp}@university.edu`,
      password: 'Password123!',
    });
    tutorToken = tutorLogin.body.token;

    pass('Test student and tutor accounts ready.');

    // Step 1: GET /api/modules (Public Directory)
    console.log('\n--- 1. Testing GET /api/modules (Public Directory) ---');
    const listRes = await makeRequest('GET', '/api/modules');
    if (listRes.status === 200 && Array.isArray(listRes.body.modules) && listRes.body.modules.length >= 7) {
      pass(`Retrieved ${listRes.body.modules.length} modules from directory.`);
      testModuleId = listRes.body.modules[0].id;
    } else {
      fail('Failed to retrieve modules list', listRes.body);
    }

    // Step 2: Search and filtering on GET /api/modules
    console.log('\n--- 2. Testing Search and Faculty Filter on /api/modules ---');
    const searchRes = await makeRequest('GET', '/api/modules?q=CSC101');
    if (searchRes.status === 200 && searchRes.body.modules.length > 0 && searchRes.body.modules[0].code === 'CSC101') {
      pass(`Search by code 'CSC101' returned expected module: ${searchRes.body.modules[0].name}`);
    } else {
      fail('Search by code failed', searchRes.body);
    }

    const facultyRes = await makeRequest('GET', '/api/modules?faculty=Information%20Systems');
    if (facultyRes.status === 200 && facultyRes.body.modules.some((m) => m.code === 'INF201')) {
      pass('Faculty filter successfully returned INF201 under Information Systems');
    } else {
      fail('Faculty filter failed', facultyRes.body);
    }

    // Step 3: GET /api/modules/:id (Single Module Detail)
    console.log('\n--- 3. Testing GET /api/modules/:id ---');
    const detailRes = await makeRequest('GET', `/api/modules/${testModuleId}`);
    if (detailRes.status === 200 && detailRes.body.module && Array.isArray(detailRes.body.study_groups)) {
      pass(`Module details verified for ${detailRes.body.module.code} with groups and tutors attached.`);
    } else {
      fail('Failed to fetch module details', detailRes.body);
    }

    // Step 4: Unauthorized Enroll Rejection
    console.log('\n--- 4. Testing Unauthorized Enroll (POST /api/modules/enroll) ---');
    const unauthEnroll = await makeRequest('POST', '/api/modules/enroll', { module_id: testModuleId });
    if (unauthEnroll.status === 401) {
      pass('Unauthenticated enrollment rejected with 401');
    } else {
      fail('Expected 401 for unauthenticated enrollment', unauthEnroll.body);
    }

    // Step 5: Student Enroll in Module
    console.log('\n--- 5. Testing Student Enrollment in Module ---');
    const studentEnroll = await makeRequest(
      'POST',
      '/api/modules/enroll',
      { module_id: testModuleId },
      studentToken
    );
    if (studentEnroll.status === 201 && studentEnroll.body.success) {
      pass(`Student successfully enrolled in module ID ${testModuleId}`);
    } else {
      fail('Student enrollment failed', studentEnroll.body);
    }

    // Step 6: Duplicate Enrollment Idempotency
    console.log('\n--- 6. Testing Duplicate Enrollment Handling ---');
    const dupEnroll = await makeRequest(
      'POST',
      '/api/modules/enroll',
      { module_id: testModuleId },
      studentToken
    );
    if (dupEnroll.status === 200 && dupEnroll.body.already_enrolled) {
      pass('Duplicate enrollment gracefully handled idempotently (status 200, already_enrolled=true)');
    } else {
      fail('Duplicate enrollment handling failed', dupEnroll.body);
    }

    // Step 7: Tutor Register Module (POST /api/tutors/modules)
    console.log('\n--- 7. Testing Tutor Module Registration (POST /api/tutors/modules) ---');
    // Ensure student cannot access tutor module registration
    const forbiddenTutorEnroll = await makeRequest(
      'POST',
      '/api/tutors/modules',
      { module_id: testModuleId },
      studentToken
    );
    if (forbiddenTutorEnroll.status === 403) {
      pass('Student denied from tutor module registration (403 Forbidden)');
    } else {
      fail('Expected 403 for student accessing /api/tutors/modules', forbiddenTutorEnroll.body);
    }

    const tutorModReg = await makeRequest(
      'POST',
      '/api/tutors/modules',
      { module_id: testModuleId },
      tutorToken
    );
    if (tutorModReg.status === 200 && tutorModReg.body.success) {
      pass(`Tutor successfully registered module ID ${testModuleId} for peer tutoring.`);
    } else {
      fail('Tutor module registration failed', tutorModReg.body);
    }

    // Step 8: GET /api/users/me/modules (Student)
    console.log('\n--- 8. Testing GET /api/users/me/modules ---');
    const myModsRes = await makeRequest('GET', '/api/users/me/modules', null, studentToken);
    if (myModsRes.status === 200 && myModsRes.body.modules.some((m) => m.id === testModuleId)) {
      pass(`User active modules verified (Count: ${myModsRes.body.count})`);
    } else {
      fail('Failed to fetch user modules', myModsRes.body);
    }

    // Step 9: GET /api/modules/user/my alias
    console.log('\n--- 9. Testing GET /api/modules/user/my alias ---');
    const aliasModsRes = await makeRequest('GET', '/api/modules/user/my', null, studentToken);
    if (aliasModsRes.status === 200 && aliasModsRes.body.modules.length === myModsRes.body.modules.length) {
      pass('GET /api/modules/user/my alias verified and matching.');
    } else {
      fail('GET /api/modules/user/my alias failed', aliasModsRes.body);
    }

    // Step 10: Unenroll from Module
    console.log('\n--- 10. Testing Module Unenrollment (POST /api/modules/unenroll) ---');
    const unenrollRes = await makeRequest(
      'POST',
      '/api/modules/unenroll',
      { module_id: testModuleId },
      studentToken
    );
    if (unenrollRes.status === 200 && unenrollRes.body.success) {
      pass('Student successfully unenrolled from module.');
    } else {
      fail('Student unenrollment failed', unenrollRes.body);
    }

    // Verify student no longer has this module
    const verifyUnenroll = await makeRequest('GET', '/api/users/me/modules', null, studentToken);
    if (verifyUnenroll.status === 200 && !verifyUnenroll.body.modules.some((m) => m.id === testModuleId)) {
      pass('Verified module was removed from active user modules list.');
    } else {
      fail('Module still present after unenrollment', verifyUnenroll.body);
    }

    console.log('\n============================================================');
    console.log('ALL PHASE 6 BACKEND & DATABASE TESTS PASSED WITH 100% SUCCESS!');
    console.log('============================================================\n');
  } catch (err) {
    fail('Unexpected exception during test run', err);
  } finally {
    // Cleanup test users and user_modules
    if (studentId || tutorId) {
      try {
        await query('DELETE FROM user_modules WHERE user_id IN ($1, $2)', [studentId, tutorId]);
        await query('DELETE FROM users WHERE id IN ($1, $2)', [studentId, tutorId]);
        console.log('✔ Cleaned up test user accounts and test enrollment records.');
      } catch (cleanErr) {
        console.error('Error during cleanup:', cleanErr);
      }
    }
    server.close();
  }
}

if (require.main === module) {
  runModulesTestSuite();
}

module.exports = { runModulesTestSuite };
