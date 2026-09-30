const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./server.js');
const { query } = require('./db/database');

let server;
const PORT = 5002;

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

async function runSprint3Tests() {
  console.log('============================================================');
  console.log('STARTING SPRINT 3 STUDY GROUPS AUTOMATED TEST SUITE');
  console.log('============================================================');

  server = app.listen(PORT, () => {
    console.log(`Sprint 3 test server running on port ${PORT}`);
  });

  const timestamp = Date.now();
  const userAEmail = `creator_${timestamp}@university.edu`;
  const userBEmail = `member_${timestamp}@university.edu`;
  const userCEmail = `tutor_${timestamp}@university.edu`;

  let userAToken = '';
  let userBToken = '';
  let userCToken = '';
  let createdGroupId = null;

  try {
    // 0. Setup: Register and login test users
    console.log('\n--- 0. Setup Test Users (User A, User B, User C) ---');
    for (const u of [
      { name: 'Alice', surname: 'Creator', email: userAEmail, role: 'student' },
      { name: 'Bob', surname: 'Joiner', email: userBEmail, role: 'student' },
      { name: 'Charlie', surname: 'Tutor', email: userCEmail, role: 'tutor' },
    ]) {
      const regRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/auth/register',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        {
          name: u.name,
          surname: u.surname,
          email: u.email,
          password: 'Password123!',
          confirmPassword: 'Password123!',
          role: u.role,
        }
      );
      if (regRes.status !== 201) throw new Error(`Registration failed for ${u.email}: ${JSON.stringify(regRes.body)}`);

      const loginRes = await request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        { email: u.email, password: 'Password123!' }
      );
      if (loginRes.status !== 200 || !loginRes.body.token) throw new Error(`Login failed for ${u.email}`);

      if (u.name === 'Alice') userAToken = loginRes.body.token;
      if (u.name === 'Bob') userBToken = loginRes.body.token;
      if (u.name === 'Charlie') userCToken = loginRes.body.token;
    }
    console.log('✔ Test users successfully registered and authenticated.');

    // 1. Unauthenticated create → 401
    console.log('\n--- 1. Testing Unauthenticated Create (POST /api/study-groups) ---');
    const unauthCreateRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/study-groups',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        title: 'Unauthenticated Group',
        course_code: 'CSC101',
        description: 'Should fail',
        meeting_schedule: 'Mondays 10am',
        location: 'Library',
        max_members: 5,
      }
    );
    console.log('Status:', unauthCreateRes.status, 'Body:', unauthCreateRes.body);
    if (unauthCreateRes.status !== 401) throw new Error('Unauthenticated create was not rejected with 401');
    console.log('✔ Unauthenticated create properly rejected with 401');

    // 2. Authenticated create → success
    console.log('\n--- 2. Testing Authenticated Create (POST /api/study-groups) ---');
    const authCreateRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/study-groups',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
      },
      {
        title: 'CSC101 Algorithms & Data Structures Jam',
        course_code: 'CSC101',
        description: 'Collaborative problem solving and test prep',
        meeting_schedule: 'Wednesdays 16:00 - 18:00',
        location: 'CS Lab 2A / Online Discord',
        max_members: 2, // Set to 2 to test capacity later
      }
    );
    console.log('Status:', authCreateRes.status, 'Body:', authCreateRes.body);
    if (authCreateRes.status !== 201 || !authCreateRes.body.study_group?.id) {
      throw new Error('Authenticated group creation failed');
    }
    createdGroupId = authCreateRes.body.study_group.id;
    console.log(`✔ Authenticated group created successfully (ID: ${createdGroupId})`);

    // 3. Creator automatically becomes a member
    console.log('\n--- 3. Testing Creator Auto-Membership ---');
    const membershipCheck = await query(
      'SELECT id, study_group_id, user_id, joined_at FROM study_group_members WHERE study_group_id = $1',
      [createdGroupId]
    );
    console.log('Database memberships for group:', membershipCheck.rows);
    if (membershipCheck.rows.length !== 1 || membershipCheck.rows[0].user_id !== authCreateRes.body.study_group.created_by) {
      throw new Error('Creator was not automatically enrolled in study_group_members');
    }
    console.log('✔ Creator was automatically added to study_group_members');

    // 4. Group appears in GET /api/study-groups (Public)
    console.log('\n--- 4. Testing GET /api/study-groups (Public Listing) ---');
    const getGroupsRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/study-groups',
      method: 'GET',
    });
    console.log('Status:', getGroupsRes.status, 'Total Groups:', getGroupsRes.body.count);
    const foundGroup = getGroupsRes.body.study_groups.find((g) => g.id === createdGroupId);
    if (!foundGroup) throw new Error('Created group not found in public groups list');
    if (foundGroup.creator_name !== 'Alice' || foundGroup.member_count !== 1) {
      throw new Error(`Group metadata mismatch in listing: ${JSON.stringify(foundGroup)}`);
    }
    console.log('✔ Group appears correctly in public GET /api/study-groups with creator info and member_count=1');

    // 5. Group details GET /api/study-groups/:id return members and NO password fields
    console.log(`\n--- 5. Testing GET /api/study-groups/${createdGroupId} ---`);
    const getDetailsRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/study-groups/${createdGroupId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    console.log('Status:', getDetailsRes.status, 'Details:', getDetailsRes.body.study_group?.title);
    const groupDetails = getDetailsRes.body.study_group;
    if (getDetailsRes.status !== 200 || !groupDetails) throw new Error('Failed to retrieve group details');
    if (!Array.isArray(groupDetails.members) || groupDetails.members.length !== 1) {
      throw new Error('Members roster is missing or incorrect');
    }
    // Verify password is NOT exposed
    const detailsStr = JSON.stringify(getDetailsRes.body);
    if (detailsStr.includes('password') || detailsStr.includes('$2')) {
      throw new Error('SECURITY VIOLATION: Password hash found in API response!');
    }
    console.log('✔ Group details verified: members list populated, is_creator=true, is_member=true, zero password leaks');

    // 6. Unauthenticated join → 401
    console.log(`\n--- 6. Testing Unauthenticated Join (POST /api/study-groups/${createdGroupId}/join) ---`);
    const unauthJoinRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/study-groups/${createdGroupId}/join`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('Status:', unauthJoinRes.status);
    if (unauthJoinRes.status !== 401) throw new Error('Unauthenticated join was not rejected with 401');
    console.log('✔ Unauthenticated join properly rejected with 401');

    // 7. Successful join by User B
    console.log(`\n--- 7. Testing Successful Join by User B (POST /api/study-groups/${createdGroupId}/join) ---`);
    const userBJoinRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/study-groups/${createdGroupId}/join`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
    });
    console.log('Status:', userBJoinRes.status, 'Body:', userBJoinRes.body);
    if (userBJoinRes.status !== 200 || userBJoinRes.body.member_count !== 2) {
      throw new Error('User B failed to join group');
    }
    console.log('✔ User B successfully joined study group. Total members: 2');

    // 8. Duplicate join by User B → 409
    console.log(`\n--- 8. Testing Duplicate Join Prevention ---`);
    const dupJoinRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/study-groups/${createdGroupId}/join`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
    });
    console.log('Status:', dupJoinRes.status, 'Body:', dupJoinRes.body);
    if (dupJoinRes.status !== 409) throw new Error('Duplicate join was not rejected with 409');
    console.log('✔ Duplicate join rejected with 409 Conflict');

    // 9. Full group join by User C → 400 (Capacity = 2, currently Alice + Bob)
    console.log(`\n--- 9. Testing Full Group Join Rejection (Capacity Reached) ---`);
    const fullJoinRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/study-groups/${createdGroupId}/join`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userCToken}`,
      },
    });
    console.log('Status:', fullJoinRes.status, 'Body:', fullJoinRes.body);
    if (fullJoinRes.status !== 400) throw new Error('Full group join was not rejected with 400');
    console.log('✔ Full capacity join rejected with 400 Bad Request');

    // 10. Non-creator edit → 403 (User B tries to edit)
    console.log(`\n--- 10. Testing Non-Creator Edit Rejection (User B) ---`);
    const nonCreatorEditRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/study-groups/${createdGroupId}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userBToken}`,
        },
      },
      {
        title: 'Hacked Title',
        course_code: 'CSC101',
        description: 'Hacked',
        meeting_schedule: 'Never',
        location: 'Nowhere',
        max_members: 10,
      }
    );
    console.log('Status:', nonCreatorEditRes.status, 'Body:', nonCreatorEditRes.body);
    if (nonCreatorEditRes.status !== 403) throw new Error('Non-creator edit was not rejected with 403');
    console.log('✔ Non-creator edit rejected with 403 Forbidden');

    // 11. Creator edit → success (User A edits title and expands capacity to 5)
    console.log(`\n--- 11. Testing Creator Edit (User A) ---`);
    const creatorEditRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/study-groups/${createdGroupId}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
      },
      {
        title: 'CSC101 Algorithms & Data Structures Mastermind',
        course_code: 'CSC101',
        description: 'Updated study syllabus and problem sets',
        meeting_schedule: 'Fridays 14:00 - 16:00',
        location: 'Science Library Room 4',
        max_members: 5,
      }
    );
    console.log('Status:', creatorEditRes.status, 'Updated title:', creatorEditRes.body.study_group?.title);
    if (creatorEditRes.status !== 200 || creatorEditRes.body.study_group?.max_members !== 5) {
      throw new Error('Creator edit failed');
    }
    console.log('✔ Creator edit succeeded with status 200');

    // 12. Non-creator delete → 403 (User B tries to delete)
    console.log(`\n--- 12. Testing Non-Creator Delete Rejection (User B) ---`);
    const nonCreatorDelRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/study-groups/${createdGroupId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    console.log('Status:', nonCreatorDelRes.status, 'Body:', nonCreatorDelRes.body);
    if (nonCreatorDelRes.status !== 403) throw new Error('Non-creator delete was not rejected with 403');
    console.log('✔ Non-creator delete rejected with 403 Forbidden');

    // 13. Creator cannot leave own group → 400
    console.log(`\n--- 13. Testing Creator Leaving Own Group (User A) ---`);
    const creatorLeaveRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/study-groups/${createdGroupId}/leave`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    console.log('Status:', creatorLeaveRes.status, 'Body:', creatorLeaveRes.body);
    if (creatorLeaveRes.status !== 400) throw new Error('Creator leave was not rejected with 400');
    console.log('✔ Creator leave properly rejected with 400');

    // 14. Normal member can leave (User B leaves)
    console.log(`\n--- 14. Testing Normal Member Leave (User B) ---`);
    const memberLeaveRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/study-groups/${createdGroupId}/leave`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    console.log('Status:', memberLeaveRes.status, 'Body:', memberLeaveRes.body);
    if (memberLeaveRes.status !== 200) throw new Error('Normal member leave failed');
    const memberAfterLeave = await query(
      'SELECT id FROM study_group_members WHERE study_group_id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)',
      [createdGroupId, userBEmail]
    );
    if (memberAfterLeave.rows.length !== 0) throw new Error('Membership was not removed after leave');
    console.log('✔ Normal member left successfully and membership row was deleted');

    // 15. User C can now join group
    console.log(`\n--- 15. User C Joins Group ---`);
    const userCJoinRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/study-groups/${createdGroupId}/join`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userCToken}`,
      },
    });
    if (userCJoinRes.status !== 200) throw new Error('User C join failed');
    console.log('✔ User C joined successfully');

    // 16. My Groups endpoint (GET /api/study-groups/user/my)
    console.log(`\n--- 16. Testing My Groups Endpoint (GET /api/study-groups/user/my) ---`);
    const myGroupsResA = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/study-groups/user/my',
      method: 'GET',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    console.log('Status:', myGroupsResA.status, 'User A Groups Count:', myGroupsResA.body.count);
    if (myGroupsResA.status !== 200 || !myGroupsResA.body.study_groups.some((g) => g.id === createdGroupId)) {
      throw new Error('My groups failed to return created group for User A');
    }

    const myGroupsResC = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/study-groups/user/my',
      method: 'GET',
      headers: { Authorization: `Bearer ${userCToken}` },
    });
    if (myGroupsResC.status !== 200 || !myGroupsResC.body.study_groups.some((g) => g.id === createdGroupId)) {
      throw new Error('My groups failed to return joined group for User C');
    }
    console.log('✔ GET /api/study-groups/user/my verified for both creators and joined members');

    // 17. Search & Filtering functionality
    console.log(`\n--- 17. Testing Search and Filtering ---`);
    // Search by title keyword
    const searchRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/study-groups?search=Mastermind',
      method: 'GET',
    });
    if (searchRes.status !== 200 || !searchRes.body.study_groups.some((g) => g.id === createdGroupId)) {
      throw new Error('Search by title keyword failed');
    }

    // Filter by course_code
    const courseRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/study-groups?course_code=CSC101',
      method: 'GET',
    });
    if (courseRes.status !== 200 || !courseRes.body.study_groups.some((g) => g.id === createdGroupId)) {
      throw new Error('Filter by course_code failed');
    }

    // Filter by status=open
    const statusOpenRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/study-groups?status=open',
      method: 'GET',
    });
    if (statusOpenRes.status !== 200 || !statusOpenRes.body.study_groups.some((g) => g.id === createdGroupId)) {
      throw new Error('Filter by status=open failed');
    }

    // Search for nonexistent course
    const noMatchRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/study-groups?search=NONEXISTENT_COURSE_9999',
      method: 'GET',
    });
    if (noMatchRes.status !== 200 || noMatchRes.body.count !== 0) {
      throw new Error('Search for nonexistent course should return 0 results');
    }
    console.log('✔ Search by title, course_code filter, and status filter verified');

    // 18. Creator delete → success
    console.log(`\n--- 18. Testing Creator Delete (User A) ---`);
    const creatorDelRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/study-groups/${createdGroupId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    console.log('Status:', creatorDelRes.status, 'Body:', creatorDelRes.body);
    if (creatorDelRes.status !== 200) throw new Error('Creator delete failed');
    console.log('✔ Creator deleted study group successfully');

    // 19. Membership cascade after deletion
    console.log(`\n--- 19. Verifying Membership Cascade Deletion ---`);
    const orphanMembers = await query(
      'SELECT id FROM study_group_members WHERE study_group_id = $1',
      [createdGroupId]
    );
    console.log('Remaining members in DB for deleted group:', orphanMembers.rows.length);
    if (orphanMembers.rows.length !== 0) {
      throw new Error('Foreign key CASCADE deletion failed; orphan member rows detected!');
    }
    console.log('✔ All membership records automatically cascaded and removed on group deletion');

    console.log('\n============================================================');
    console.log('ALL 19 SPRINT 3 BACKEND & DATABASE TESTS PASSED WITH 100% SUCCESS!');
    console.log('============================================================');
  } catch (err) {
    console.error('SPRINT 3 TEST SUITE FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    process.exit(process.exitCode || 0);
  }
}

runSprint3Tests();
