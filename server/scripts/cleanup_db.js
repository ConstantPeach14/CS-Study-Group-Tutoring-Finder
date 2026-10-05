/**
 * Database Cleanup Script
 * 1. Delete "Phase5 Verification Group CS999" study group (+ cascade memberships)
 * 2. Remove all tutors except Jungkook Jeon and Taehyung Kim
 *    (delete their tutor_profiles rows + change role to student — NOT hard-delete users)
 * 3. Remove all tutor_profiles course_code entries except M20, DTS97, WB20
 *    (strips other codes from the course_codes field for remaining tutors)
 */

require('dotenv').config();
const { Pool } = require('pg');

// Use the same DB config as the main server
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function pass(msg) { console.log(`  ✔ ${msg}`); }
function info(msg) { console.log(`  ℹ ${msg}`); }
function fail(msg) { console.log(`  ✘ ${msg}`); }

async function run() {
  const client = await pool.connect();
  console.log('\n=== Database Cleanup Script ===\n');

  try {
    await client.query('BEGIN');

    // ────────────────────────────────────────────────────────────────────────
    // 1. Delete "Phase5 Verification Group CS999"
    // ────────────────────────────────────────────────────────────────────────
    console.log('--- 1. Remove Phase5 Verification Group (CS999) ---');

    const findGroup = await client.query(
      `SELECT id, title, course_code FROM study_groups
       WHERE LOWER(title) LIKE '%phase5%' OR course_code = 'CS999'`
    );

    if (findGroup.rows.length === 0) {
      info('Study group not found — may have already been deleted.');
    } else {
      for (const group of findGroup.rows) {
        // Delete memberships first (foreign key cascade should handle it, but be explicit)
        const delMembers = await client.query(
          'DELETE FROM study_group_members WHERE study_group_id = $1',
          [group.id]
        );
        info(`Deleted ${delMembers.rowCount} membership(s) for group "${group.title}"`);

        const delGroup = await client.query(
          'DELETE FROM study_groups WHERE id = $1',
          [group.id]
        );
        if (delGroup.rowCount > 0) {
          pass(`Deleted study group: "${group.title}" (id=${group.id}, code=${group.course_code})`);
        }
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. Remove all tutors except Jungkook Jeon and Taehyung Kim
    //    Strategy: delete tutor_profiles for others; set their role to 'student'
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. Remove All Tutors Except Jungkook Jeon & Taehyung Kim ---');

    // Show all current tutors first
    const allTutors = await client.query(
      `SELECT u.id, u.name, u.surname, u.email, tp.id AS profile_id
       FROM users u
       LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
       WHERE u.role = 'tutor'
       ORDER BY u.id`
    );
    info(`Found ${allTutors.rows.length} tutor account(s) total:`);
    for (const t of allTutors.rows) {
      console.log(`    → id=${t.id} | ${t.name} ${t.surname} | ${t.email} | profile_id=${t.profile_id}`);
    }

    // Identify tutors to KEEP (Jungkook Jeon + Taehyung Kim)
    const keepResult = await client.query(
      `SELECT u.id FROM users u
       WHERE u.role = 'tutor'
         AND (
           (LOWER(u.name) = 'jungkook' AND LOWER(u.surname) = 'jeon')
           OR
           (LOWER(u.name) = 'taehyung' AND LOWER(u.surname) = 'kim')
         )`
    );
    const keepIds = keepResult.rows.map(r => r.id);

    if (keepIds.length === 0) {
      fail('Could not find Jungkook Jeon or Taehyung Kim in the database!');
      fail('Check exact name spellings in your database.');
      // Show a fuzzy search to help diagnose
      const fuzzy = await client.query(
        `SELECT id, name, surname, email FROM users WHERE role = 'tutor'`
      );
      info('All tutors in DB:');
      fuzzy.rows.forEach(r => console.log(`    → ${r.id}: ${r.name} ${r.surname} (${r.email})`));
    } else {
      info(`Keeping tutor IDs: [${keepIds.join(', ')}]`);

      // Get tutors to remove
      const toRemove = allTutors.rows.filter(t => !keepIds.includes(t.id));
      info(`Removing ${toRemove.length} tutor(s):`);

      for (const t of toRemove) {
        // 2a. Delete their tutor_profile if it exists
        if (t.profile_id) {
          await client.query('DELETE FROM tutor_profiles WHERE user_id = $1', [t.id]);
          info(`  Deleted tutor_profile for ${t.name} ${t.surname} (profile_id=${t.profile_id})`);
        }

        // 2b. Cancel any pending tutoring requests they're involved in
        await client.query(
          `UPDATE tutoring_requests SET status = 'cancelled'
           WHERE tutor_id = $1 AND status = 'pending'`,
          [t.id]
        );

        // 2c. Change role to 'student' (preserves account, just demotes)
        await client.query(
          `UPDATE users SET role = 'student' WHERE id = $1`,
          [t.id]
        );

        pass(`Removed tutor listing for ${t.name} ${t.surname} (id=${t.id}) — demoted to student`);
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. For remaining tutors: strip all course_codes except M20, DTS97, WB20
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. Strip Course Codes — Keep Only M20, DTS97, WB20 ---');

    const KEEP_CODES = ['M20', 'DTS97', 'WB20'];

    const remainingProfiles = await client.query(
      `SELECT tp.id, tp.user_id, tp.course_codes, u.name, u.surname
       FROM tutor_profiles tp
       JOIN users u ON u.id = tp.user_id
       WHERE u.role = 'tutor'`
    );

    info(`Processing ${remainingProfiles.rows.length} remaining tutor profile(s):`);

    for (const profile of remainingProfiles.rows) {
      const rawCodes = profile.course_codes || '';
      info(`  ${profile.name} ${profile.surname} — current codes: "${rawCodes}"`);

      // Parse existing codes, filter to only kept ones
      const existingCodes = rawCodes
        .split(',')
        .map(c => c.trim().toUpperCase())
        .filter(c => c.length > 0);

      const filteredCodes = existingCodes.filter(c => KEEP_CODES.includes(c));

      // Determine which of the 3 codes this tutor had — keep all 3 if they had any,
      // otherwise set to all 3 (so the remaining tutors can tutor these modules)
      const finalCodes = filteredCodes.length > 0
        ? filteredCodes.join(', ')
        : KEEP_CODES.join(', ');

      await client.query(
        'UPDATE tutor_profiles SET course_codes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [finalCodes, profile.id]
      );

      pass(`  Updated ${profile.name} ${profile.surname}: "${rawCodes}" → "${finalCodes}"`);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Commit
    // ────────────────────────────────────────────────────────────────────────
    await client.query('COMMIT');
    console.log('\n=== Cleanup Complete — All changes committed ===\n');

    // Final verification
    console.log('--- Final State Verification ---');
    const finalTutors = await client.query(
      `SELECT u.id, u.name, u.surname, u.email, tp.course_codes, tp.subjects
       FROM users u
       JOIN tutor_profiles tp ON u.id = tp.user_id
       WHERE u.role = 'tutor'
       ORDER BY u.id`
    );
    info(`Remaining tutor profiles: ${finalTutors.rows.length}`);
    for (const t of finalTutors.rows) {
      console.log(`    ✔ id=${t.id} | ${t.name} ${t.surname} | codes: ${t.course_codes}`);
    }

    const finalGroups = await client.query(
      `SELECT id, title, course_code FROM study_groups ORDER BY id`
    );
    info(`Remaining study groups: ${finalGroups.rows.length}`);
    for (const g of finalGroups.rows) {
      console.log(`    ✔ id=${g.id} | ${g.title} | ${g.course_code}`);
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error — transaction rolled back:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
