/**
 * Automated Test Suite for Sprint 4: Tutor Finder & Tutoring Requests
 */
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'cs_study_tutoring_finder_secure_jwt_secret_key_2026!';

const app = require('./server');
const { pool, query } = require('./db/database');

const TEST_PORT = 5003;
let serverInstance;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Helper: HTTP request wrapper
function makeRequest(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, body: json });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runTests() {
  console.log('============================================================');
  console.log('STARTING SPRINT 4 TUTOR FINDER AUTOMATED TEST SUITE');
  console.log('============================================================');

  let passedCount = 0;

  // Start test server
  await new Promise((resolve) => {
    serverInstance = app.listen(TEST_PORT, () => {
      console.log(`Sprint 4 test server running on port ${TEST_PORT}`);
      resolve();
    });
  });

  try {
    const ts = Date.now();
    // Create Test Tutor 1
    const tutor1Email = `tutor1_${ts}@test.edu`;
    await makeRequest('POST', '/api/auth/register', {
      name: 'Grace',
      surname: 'Hopper',
      email: tutor1Email,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'tutor',
    });
    const tutor1Login = await makeRequest('POST', '/api/auth/login', {
      email: tutor1Email,
      password: 'Password123!',
    });
    const tutor1Token = tutor1Login.body.token;
    const tutor1Id = tutor1Login.body.user.id;

    // Create Test Tutor 2
    const tutor2Email = `tutor2_${ts}@test.edu`;
    await makeRequest('POST', '/api/auth/register', {
      name: 'Alan',
      surname: 'Turing',
      email: tutor2Email,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'tutor',
    });
    const tutor2Login = await makeRequest('POST', '/api/auth/login', {
      email: tutor2Email,
      password: 'Password123!',
    });
    const tutor2Token = tutor2Login.body.token;
    const tutor2Id = tutor2Login.body.user.id;

    // Create Test Student 1
    const student1Email = `student1_${ts}@test.edu`;
    await makeRequest('POST', '/api/auth/register', {
      name: 'Ada',
      surname: 'Lovelace',
      email: student1Email,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'student',
    });
    const student1Login = await makeRequest('POST', '/api/auth/login', {
      email: student1Email,
      password: 'Password123!',
    });
    const student1Token = student1Login.body.token;
    const student1Id = student1Login.body.user.id;

    // Create Test Student 2
    const student2Email = `student2_${ts}@test.edu`;
    await makeRequest('POST', '/api/auth/register', {
      name: 'Charles',
      surname: 'Babbage',
      email: student2Email,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      role: 'student',
    });
    const student2Login = await makeRequest('POST', '/api/auth/login', {
      email: student2Email,
      password: 'Password123!',
    });
    const student2Token = student2Login.body.token;
    const student2Id = student2Login.body.user.id;

    console.log('✔ Test users successfully registered and authenticated.');

    // 1. Student cannot create or edit tutor profile
    console.log('\n--- 1. Testing Student Access Denial to Tutor Profile ---');
    const studentProfileRes = await makeRequest('PUT', '/api/tutors/me', {
      subjects: 'Computer Science',
      course_codes: 'CSC101',
      availability: 'Weekdays',
    }, student1Token);
    assert(studentProfileRes.status === 403, `Expected 403 Forbidden, got ${studentProfileRes.status}`);
    console.log('✔ Student rejected with 403 when attempting to edit tutor profile');
    passedCount++;

    // 2. Tutor creates own profile
    console.log('\n--- 2. Testing Tutor Profile Creation (PUT /api/tutors/me) ---');
    const tutorProfileRes = await makeRequest('PUT', '/api/tutors/me', {
      bio: 'PhD researcher in Computer Science specializing in compilers and systems.',
      subjects: 'Computer Science, Algorithms, Systems Architecture',
      course_codes: 'CSC101, CSC201, INF202',
      qualifications: 'BSc Computer Science (Distinction), MSc',
      availability: 'Mondays & Thursdays 14:00 - 18:00',
    }, tutor1Token);
    assert(tutorProfileRes.status === 200, `Expected 200, got ${tutorProfileRes.status}`);
    assert(tutorProfileRes.body.profile.subjects.includes('Computer Science'), 'Profile subjects not set');
    assert(tutorProfileRes.body.profile.course_codes === 'CSC101, CSC201, INF202', 'Course codes mismatch');
    console.log('✔ Tutor 1 profile created/updated successfully');
    passedCount++;

    // Tutor 2 also creates profile
    await makeRequest('PUT', '/api/tutors/me', {
      bio: 'Mathematics and Logic enthusiast.',
      subjects: 'Pure Mathematics, Cryptography',
      course_codes: 'MAM100, MAM102',
      qualifications: 'BSc Applied Mathematics',
      availability: 'Tuesdays & Fridays 10:00 - 14:00',
    }, tutor2Token);

    // 3. Tutor retrieves own profile (GET /api/tutors/me)
    console.log('\n--- 3. Testing Tutor Profile Retrieval (GET /api/tutors/me) ---');
    const getOwnProfile = await makeRequest('GET', '/api/tutors/me', null, tutor1Token);
    assert(getOwnProfile.status === 200, `Expected 200, got ${getOwnProfile.status}`);
    assert(getOwnProfile.body.profile.tutor_id === tutor1Id, 'Mismatched tutor ID');
    assert(!getOwnProfile.body.profile.password, 'Password exposed in profile payload!');
    console.log('✔ GET /api/tutors/me returns authenticated tutor profile securely');
    passedCount++;

    // 4. Public Tutor Listing (GET /api/tutors)
    console.log('\n--- 4. Testing Public Tutor Listing (GET /api/tutors) ---');
    const allTutorsRes = await makeRequest('GET', '/api/tutors');
    assert(allTutorsRes.status === 200, `Expected 200, got ${allTutorsRes.status}`);
    assert(allTutorsRes.body.tutors.length >= 2, 'Expected at least 2 tutors in listing');
    const foundTutor1 = allTutorsRes.body.tutors.find(t => t.tutor_id === tutor1Id);
    assert(foundTutor1, 'Tutor 1 missing from public listing');
    assert(foundTutor1.subjects.includes('Algorithms'), 'Tutor 1 subjects missing');
    console.log(`✔ Public GET /api/tutors listing working with ${allTutorsRes.body.count} tutors`);
    passedCount++;

    // 5. Search Tutors by keyword
    console.log('\n--- 5. Testing Search and Filtering ---');
    const searchRes = await makeRequest('GET', '/api/tutors?search=Hopper');
    assert(searchRes.status === 200, `Expected 200, got ${searchRes.status}`);
    assert(searchRes.body.tutors.some(t => t.surname === 'Hopper'), 'Search by name failed');

    const courseFilterRes = await makeRequest('GET', '/api/tutors?course_code=CSC101');
    assert(courseFilterRes.status === 200, `Expected 200, got ${courseFilterRes.status}`);
    assert(courseFilterRes.body.tutors.some(t => t.tutor_id === tutor1Id), 'Course filter failed');

    const noResultsRes = await makeRequest('GET', '/api/tutors?search=NonExistentSubjectXYZ999');
    assert(noResultsRes.status === 200, `Expected 200, got ${noResultsRes.status}`);
    assert(noResultsRes.body.tutors.length === 0, 'Expected 0 results for non-matching search');
    console.log('✔ Search by name, course_code, and empty state verified');
    passedCount++;

    // 6. Public Tutor Detail (GET /api/tutors/:id)
    console.log('\n--- 6. Testing Tutor Detail (GET /api/tutors/:id) ---');
    const tutorDetailRes = await makeRequest('GET', `/api/tutors/${tutor1Id}`, null, student1Token);
    assert(tutorDetailRes.status === 200, `Expected 200, got ${tutorDetailRes.status}`);
    assert(tutorDetailRes.body.tutor.name === 'Grace', 'Incorrect tutor name in detail');
    assert(tutorDetailRes.body.tutor.my_request === null, 'Expected my_request to be null before requesting');
    console.log('✔ Public GET /api/tutors/:id verified');
    passedCount++;

    // 7. Unauthenticated Tutoring Request Rejection
    console.log('\n--- 7. Testing Unauthenticated Tutoring Request Rejection ---');
    const unauthReq = await makeRequest('POST', '/api/tutoring-requests', {
      tutor_id: tutor1Id,
      course_code: 'CSC101',
      message: 'Need help with recursion',
    });
    assert(unauthReq.status === 401, `Expected 401, got ${unauthReq.status}`);
    console.log('✔ Unauthenticated tutoring request properly rejected with 401');
    passedCount++;

    // 8. Tutor Requesting Self Rejection
    console.log('\n--- 8. Testing Self-Request Prevention ---');
    const selfReq = await makeRequest('POST', '/api/tutoring-requests', {
      tutor_id: tutor1Id,
      course_code: 'CSC101',
    }, tutor1Token);
    assert(selfReq.status === 400 || selfReq.status === 403, `Expected 400/403, got ${selfReq.status}`);
    console.log('✔ Self-request / Tutor role requesting tutor properly rejected');
    passedCount++;

    // 9. Student Successfully Submits Request
    console.log('\n--- 9. Testing Student Submitting Tutoring Request ---');
    const createReqRes = await makeRequest('POST', '/api/tutoring-requests', {
      tutor_id: tutor1Id,
      course_code: 'CSC101',
      message: 'Hi Grace, I need help with dynamic programming and memory management.',
    }, student1Token);
    assert(createReqRes.status === 201, `Expected 201 Created, got ${createReqRes.status}`);
    assert(createReqRes.body.request.status === 'pending', 'Status should be pending');
    const createdRequestId = createReqRes.body.request.id;
    console.log(`✔ Student 1 submitted tutoring request #${createdRequestId} with status 'pending'`);
    passedCount++;

    // 10. Duplicate Pending Request Prevention
    console.log('\n--- 10. Testing Duplicate Pending Request Prevention ---');
    const dupReqRes = await makeRequest('POST', '/api/tutoring-requests', {
      tutor_id: tutor1Id,
      course_code: 'CSC101',
      message: 'Another request while one is pending',
    }, student1Token);
    assert(dupReqRes.status === 409, `Expected 409 Conflict, got ${dupReqRes.status}`);
    console.log('✔ Duplicate pending request rejected with 409 Conflict');
    passedCount++;

    // 11. Student Views Own Requests (GET /api/tutoring-requests/my)
    console.log('\n--- 11. Testing Student View Outgoing Requests ---');
    const myReqsRes = await makeRequest('GET', '/api/tutoring-requests/my', null, student1Token);
    assert(myReqsRes.status === 200, `Expected 200, got ${myReqsRes.status}`);
    assert(myReqsRes.body.requests.length >= 1, 'Expected at least 1 request for student 1');
    assert(myReqsRes.body.requests[0].tutor_name === 'Grace', 'Tutor name missing in student request item');
    console.log('✔ GET /api/tutoring-requests/my returned student requests correctly');
    passedCount++;

    // 12. Student Cannot View Other Student Requests
    console.log('\n--- 12. Testing Student Isolation ---');
    const student2ReqsRes = await makeRequest('GET', '/api/tutoring-requests/my', null, student2Token);
    assert(student2ReqsRes.status === 200, `Expected 200, got ${student2ReqsRes.status}`);
    assert(student2ReqsRes.body.requests.length === 0, 'Student 2 should have 0 requests');
    console.log('✔ Student request isolation verified');
    passedCount++;

    // 13. Tutor Views Received Requests (GET /api/tutoring-requests/received)
    console.log('\n--- 13. Testing Tutor View Incoming Requests ---');
    const receivedReqsRes = await makeRequest('GET', '/api/tutoring-requests/received', null, tutor1Token);
    assert(receivedReqsRes.status === 200, `Expected 200, got ${receivedReqsRes.status}`);
    assert(receivedReqsRes.body.requests.length >= 1, 'Expected at least 1 received request for tutor 1');
    assert(receivedReqsRes.body.requests[0].student_name === 'Ada', 'Student name missing in received request');
    console.log('✔ Tutor 1 received requests retrieved successfully');
    passedCount++;

    // 14. Other Tutor Does Not See Tutor 1 Requests
    console.log('\n--- 14. Testing Tutor Request Isolation ---');
    const tutor2Received = await makeRequest('GET', '/api/tutoring-requests/received', null, tutor2Token);
    assert(tutor2Received.status === 200, `Expected 200, got ${tutor2Received.status}`);
    assert(tutor2Received.body.requests.length === 0, 'Tutor 2 should not see Tutor 1 incoming requests');
    console.log('✔ Tutor request isolation verified');
    passedCount++;

    // 15. Student Cannot Accept or Decline Request
    console.log('\n--- 15. Testing Student Forbidden to Accept/Decline ---');
    const studentAccept = await makeRequest('PATCH', `/api/tutoring-requests/${createdRequestId}`, {
      status: 'accepted',
    }, student1Token);
    assert(studentAccept.status === 403, `Expected 403 Forbidden, got ${studentAccept.status}`);
    console.log('✔ Student forbidden from accepting or declining request');
    passedCount++;

    // 16. Wrong Tutor Cannot Modify Request
    console.log('\n--- 16. Testing Wrong Tutor Unauthorized Decision ---');
    const wrongTutorDecision = await makeRequest('PATCH', `/api/tutoring-requests/${createdRequestId}`, {
      status: 'accepted',
    }, tutor2Token);
    assert(wrongTutorDecision.status === 403, `Expected 403 Forbidden, got ${wrongTutorDecision.status}`);
    console.log('✔ Wrong tutor forbidden from modifying request');
    passedCount++;

    // 17. Target Tutor Accepts Request
    console.log('\n--- 17. Testing Tutor Accepting Request ---');
    const acceptRes = await makeRequest('PATCH', `/api/tutoring-requests/${createdRequestId}`, {
      status: 'accepted',
    }, tutor1Token);
    assert(acceptRes.status === 200, `Expected 200, got ${acceptRes.status}`);
    assert(acceptRes.body.request.status === 'accepted', 'Expected status to be accepted');
    console.log('✔ Tutor 1 successfully accepted tutoring request');
    passedCount++;

    // 18. Student Submits Second Request (now allowed because first is accepted, not pending)
    console.log('\n--- 18. Testing Follow-up Request After Decision ---');
    const req2Res = await makeRequest('POST', '/api/tutoring-requests', {
      tutor_id: tutor1Id,
      course_code: 'INF202',
      message: 'Need help with relational schemas',
    }, student1Token);
    assert(req2Res.status === 201, `Expected 201 Created, got ${req2Res.status}`);
    const req2Id = req2Res.body.request.id;
    console.log(`✔ Follow-up request #${req2Id} created successfully`);
    passedCount++;

    // 19. Tutor Declines Second Request
    console.log('\n--- 19. Testing Tutor Declining Request ---');
    const declineRes = await makeRequest('PATCH', `/api/tutoring-requests/${req2Id}`, {
      status: 'declined',
    }, tutor1Token);
    assert(declineRes.status === 200, `Expected 200, got ${declineRes.status}`);
    assert(declineRes.body.request.status === 'declined', 'Expected status to be declined');
    console.log('✔ Tutor 1 successfully declined second request');
    passedCount++;

    // 20. Student Cancels Own Pending Request
    console.log('\n--- 20. Testing Student Canceling Pending Request ---');
    const req3Res = await makeRequest('POST', '/api/tutoring-requests', {
      tutor_id: tutor2Id,
      course_code: 'MAM100',
      message: 'Linear algebra review',
    }, student1Token);
    const req3Id = req3Res.body.request.id;

    const cancelRes = await makeRequest('PATCH', `/api/tutoring-requests/${req3Id}`, {
      status: 'cancelled',
    }, student1Token);
    assert(cancelRes.status === 200, `Expected 200, got ${cancelRes.status}`);
    assert(cancelRes.body.request.status === 'cancelled', 'Expected status to be cancelled');
    console.log('✔ Student successfully cancelled own pending request');
    passedCount++;

    console.log('\n============================================================');
    console.log(`ALL ${passedCount} SPRINT 4 TUTOR FINDER TESTS PASSED WITH 100% SUCCESS!`);
    console.log('============================================================');
  } catch (err) {
    console.error('\n❌ Test suite failed:', err);
    process.exitCode = 1;
  } finally {
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await pool.end();
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
