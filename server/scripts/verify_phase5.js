/**
 * Phase 5 Integration Verification Script
 * Tests all dashboard API endpoints end-to-end
 */

const http = require('http');

const BASE = 'http://localhost:5000';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const json = body ? JSON.stringify(body) : null;
    const options = {
      method,
      hostname: 'localhost',
      port: 5000,
      path,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(json ? { 'Content-Length': Buffer.byteLength(json) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (json) req.write(json);
    req.end();
  });
}

function pass(msg) { console.log(`  ✔ ${msg}`); }
function fail(msg) { console.log(`  ✘ FAIL: ${msg}`); process.exitCode = 1; }

async function run() {
  console.log('\n=== Phase 5 Dashboard Integration Verification ===\n');

  // 1. Health check
  console.log('--- 1. Backend Health ---');
  const health = await request('GET', '/api/health');
  if (health.status === 200 && health.body.database === 'connected') {
    pass(`Health OK — DB connected`);
  } else {
    fail(`Health check failed: ${JSON.stringify(health.body)}`);
    return;
  }

  // 2. Register student
  console.log('\n--- 2. Register Student ---');
  const ts = Date.now();
  const studentEmail = `p5student_${ts}@verify.com`;
  const tutorEmail = `p5tutor_${ts}@verify.com`;

  const reg1 = await request('POST', '/api/auth/register', {
    name: 'DashStudent', surname: 'VerifyTest',
    email: studentEmail, password: 'Test1234x', confirmPassword: 'Test1234x', role: 'student',
  });
  if (reg1.status === 201 && reg1.body.user?.id) {
    pass(`Student registered — id: ${reg1.body.user.id}`);
  } else {
    fail(`Student registration: ${JSON.stringify(reg1.body)}`);
    return;
  }

  // Login student to get token
  const login1 = await request('POST', '/api/auth/login', {
    email: studentEmail, password: 'Test1234x',
  });
  if (login1.status === 200 && login1.body.token) {
    pass(`Student logged in — token issued`);
  } else {
    fail(`Student login: ${JSON.stringify(login1.body)}`);
    return;
  }
  const studentToken = login1.body.token;

  // 3. Register tutor
  console.log('\n--- 3. Register Tutor ---');
  const reg2 = await request('POST', '/api/auth/register', {
    name: 'DashTutor', surname: 'VerifyTest',
    email: tutorEmail, password: 'Test1234x', confirmPassword: 'Test1234x', role: 'tutor',
  });
  if (reg2.status === 201 && reg2.body.user?.id) {
    pass(`Tutor registered — id: ${reg2.body.user.id}`);
  } else {
    fail(`Tutor registration: ${JSON.stringify(reg2.body)}`);
    return;
  }
  const tutorId = reg2.body.user.id;

  // Login tutor to get token
  const login2 = await request('POST', '/api/auth/login', {
    email: tutorEmail, password: 'Test1234x',
  });
  if (login2.status === 200 && login2.body.token) {
    pass(`Tutor logged in — token issued`);
  } else {
    fail(`Tutor login: ${JSON.stringify(login2.body)}`);
    return;
  }
  const tutorToken = login2.body.token;

  // 4. GET /api/users/me (student)
  console.log('\n--- 4. GET /api/users/me (Student) ---');
  const me1 = await request('GET', '/api/users/me', null, studentToken);
  if (me1.status === 200 && me1.body.user && !me1.body.user.password) {
    pass(`Student profile returned — no password in response`);
    pass(`  name: ${me1.body.user.name}, role: ${me1.body.user.role}, created_at: ${me1.body.user.created_at}`);
  } else {
    fail(`GET /api/users/me student: ${JSON.stringify(me1.body)}`);
  }

  // 5. GET /api/users/me (tutor)
  console.log('\n--- 5. GET /api/users/me (Tutor) ---');
  const me2 = await request('GET', '/api/users/me', null, tutorToken);
  if (me2.status === 200 && me2.body.user && !me2.body.user.password) {
    pass(`Tutor profile returned — no password in response`);
  } else {
    fail(`GET /api/users/me tutor: ${JSON.stringify(me2.body)}`);
  }

  // 6. Student dashboard: GET /api/study-groups/user/my (empty)
  console.log('\n--- 6. Student GET /api/study-groups/user/my (empty) ---');
  const sg1 = await request('GET', '/api/study-groups/user/my', null, studentToken);
  if (sg1.status === 200 && Array.isArray(sg1.body.study_groups)) {
    pass(`Student my groups returned — count: ${sg1.body.study_groups.length}`);
  } else {
    fail(`Student my groups: ${JSON.stringify(sg1.body)}`);
  }

  // 7. Student dashboard: GET /api/tutoring-requests/my (empty)
  console.log('\n--- 7. Student GET /api/tutoring-requests/my (empty) ---');
  const tr1 = await request('GET', '/api/tutoring-requests/my', null, studentToken);
  if (tr1.status === 200 && Array.isArray(tr1.body.requests)) {
    pass(`Student tutoring requests returned — count: ${tr1.body.requests.length}`);
  } else {
    fail(`Student tutoring requests: ${JSON.stringify(tr1.body)}`);
  }

  // 8. Tutor dashboard: GET /api/tutors/me (no profile yet)
  console.log('\n--- 8. Tutor GET /api/tutors/me (no profile yet) ---');
  const tp1 = await request('GET', '/api/tutors/me', null, tutorToken);
  if (tp1.status === 200) {
    const hasProfile = tp1.body.profile?.profile_id != null;
    pass(`Tutor /api/tutors/me OK — profile_id: ${hasProfile ? tp1.body.profile.profile_id : 'null (no profile yet)'}`);
  } else {
    fail(`Tutor /api/tutors/me: ${JSON.stringify(tp1.body)}`);
  }

  // 9. Tutor dashboard: GET /api/tutoring-requests/received (empty)
  console.log('\n--- 9. Tutor GET /api/tutoring-requests/received (empty) ---');
  const tr2 = await request('GET', '/api/tutoring-requests/received', null, tutorToken);
  if (tr2.status === 200 && Array.isArray(tr2.body.requests)) {
    pass(`Tutor received requests returned — count: ${tr2.body.requests.length}`);
  } else {
    fail(`Tutor received requests: ${JSON.stringify(tr2.body)}`);
  }

  // 10. Create tutor profile
  console.log('\n--- 10. Create Tutor Profile (PUT /api/tutors/me) ---');
  const tp2 = await request('PUT', '/api/tutors/me', {
    bio: 'Top student helping peers with algorithms and data structures.',
    subjects: 'Mathematics, Data Structures, Algorithms',
    course_codes: 'MATH101, CS201, CS301',
    qualifications: "Dean's List Student, 3.9 GPA",
    availability: 'Weekdays 14:00-18:00',
  }, tutorToken);
  if (tp2.status === 200 && tp2.body.profile?.profile_id) {
    pass(`Tutor profile created — profile_id: ${tp2.body.profile.profile_id}`);
    pass(`  subjects: ${tp2.body.profile.subjects}`);
    pass(`  course_codes: ${tp2.body.profile.course_codes}`);
    pass(`  availability: ${tp2.body.profile.availability}`);
  } else {
    fail(`Tutor profile create: ${JSON.stringify(tp2.body)}`);
  }

  // 11. Tutor dashboard: GET /api/tutors/me (with profile)
  console.log('\n--- 11. Tutor GET /api/tutors/me (with profile) ---');
  const tp3 = await request('GET', '/api/tutors/me', null, tutorToken);
  if (tp3.status === 200 && tp3.body.profile?.profile_id) {
    pass(`Profile summary data available for Tutor Dashboard`);
  } else {
    fail(`Tutor /api/tutors/me after create: ${JSON.stringify(tp3.body)}`);
  }

  // 12. Create a study group as student
  console.log('\n--- 12. Create Study Group (Student) ---');
  const sg2 = await request('POST', '/api/study-groups', {
    title: 'Phase5 Verification Group',
    course_code: 'CS999',
    description: 'Dashboard verification test group',
    meeting_schedule: 'Mondays 10:00-12:00',
    location: 'Library Room 3B',
    max_members: 10,
  }, studentToken);
  if (sg2.status === 201 && sg2.body.study_group?.id) {
    pass(`Study group created — id: ${sg2.body.study_group.id}`);
  } else {
    fail(`Create study group: ${JSON.stringify(sg2.body)}`);
  }

  // 13. Student my groups (should now have 1)
  console.log('\n--- 13. Student GET /api/study-groups/user/my (with group) ---');
  const sg3 = await request('GET', '/api/study-groups/user/my', null, studentToken);
  if (sg3.status === 200 && sg3.body.study_groups?.length === 1) {
    pass(`My groups count correct: ${sg3.body.study_groups.length}`);
    pass(`  title: ${sg3.body.study_groups[0].title}, course_code: ${sg3.body.study_groups[0].course_code}`);
    pass(`  is_creator: ${sg3.body.study_groups[0].is_creator}, is_member: ${sg3.body.study_groups[0].is_member}`);
  } else {
    fail(`Student my groups count: expected 1, got ${sg3.body.study_groups?.length}. ${JSON.stringify(sg3.body)}`);
  }

  // 14. Student sends tutoring request to tutor
  console.log('\n--- 14. Student POST /api/tutoring-requests ---');
  const reqRes = await request('POST', '/api/tutoring-requests', {
    tutor_id: tutorId,
    course_code: 'CS201',
    message: 'Please help me with algorithms',
  }, studentToken);
  if (reqRes.status === 201 && reqRes.body.request?.id) {
    pass(`Tutoring request submitted — id: ${reqRes.body.request.id}`);
  } else {
    fail(`Tutoring request: ${JSON.stringify(reqRes.body)}`);
  }

  // 15. Student my requests (should have 1 pending)
  console.log('\n--- 15. Student GET /api/tutoring-requests/my (1 pending) ---');
  const tr3 = await request('GET', '/api/tutoring-requests/my', null, studentToken);
  if (tr3.status === 200 && tr3.body.requests?.length === 1 && tr3.body.requests[0].status === 'pending') {
    pass(`Student has 1 pending request — tutor: ${tr3.body.requests[0].tutor_name} ${tr3.body.requests[0].tutor_surname}`);
  } else {
    fail(`Student my requests: ${JSON.stringify(tr3.body)}`);
  }

  // 16. Tutor received requests (should have 1)
  console.log('\n--- 16. Tutor GET /api/tutoring-requests/received ---');
  const tr4 = await request('GET', '/api/tutoring-requests/received', null, tutorToken);
  if (tr4.status === 200 && tr4.body.requests?.length === 1) {
    pass(`Tutor has 1 incoming request — student: ${tr4.body.requests[0].student_name} ${tr4.body.requests[0].student_surname}`);
  } else {
    fail(`Tutor received requests: ${JSON.stringify(tr4.body)}`);
  }

  // 17. Tutor accepts request
  const reqId = tr4.body.requests?.[0]?.id;
  if (reqId) {
    console.log('\n--- 17. Tutor PATCH /api/tutoring-requests/:id (accept) ---');
    const accept = await request('PATCH', `/api/tutoring-requests/${reqId}`, { status: 'accepted' }, tutorToken);
    if (accept.status === 200 && accept.body.request?.status === 'accepted') {
      pass(`Tutor accepted request ${reqId}`);
    } else {
      fail(`Accept request: ${JSON.stringify(accept.body)}`);
    }
  }

  // 18. Role isolation: student cannot call received endpoint (403 or 401 expected)
  console.log('\n--- 18. Role Isolation: Student → /api/tutoring-requests/received ---');
  const iso = await request('GET', '/api/tutoring-requests/received', null, studentToken);
  if (iso.status === 403) {
    pass(`Role isolation correct — student gets 403 on tutor-only endpoint`);
  } else {
    fail(`Expected 403 for student on received endpoint, got ${iso.status}: ${JSON.stringify(iso.body)}`);
  }

  // 19. Unauthenticated access (401 expected)
  console.log('\n--- 19. Unauthenticated Access Rejection ---');
  const unauth = await request('GET', '/api/users/me');
  if (unauth.status === 401) {
    pass(`Unauthenticated access returns 401`);
  } else {
    fail(`Expected 401, got ${unauth.status}`);
  }

  console.log('\n=== Verification Complete ===\n');
  if (process.exitCode === 1) {
    console.log('❌ Some tests FAILED — review above');
  } else {
    console.log('✅ All Phase 5 dashboard integration checks PASSED!');
  }
}

run().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
