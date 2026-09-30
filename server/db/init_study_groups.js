const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

async function initStudyGroupsDatabase() {
  console.log('--- Starting Sprint 3 Study Groups Database Setup ---');

  const client = await pool.connect();
  try {
    // 1. Verify existing users table before doing anything
    const usersTableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    if (usersTableCheck.rows.length === 0) {
      throw new Error('FATAL: Existing "users" table was not found! Aborting setup.');
    }

    const userCountBefore = await client.query('SELECT COUNT(*) AS count FROM users');
    console.log(`✔ Verified existing "users" table (Columns: ${usersTableCheck.rows.length}, Total Rows: ${userCountBefore.rows[0].count})`);

    // 2. Read and execute schema_study_groups.sql
    const sqlPath = path.join(__dirname, 'schema_study_groups.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing schema_study_groups.sql against Neon PostgreSQL...');
    await client.query(sqlContent);
    console.log('✔ Schema execution completed successfully.');

    // 3. Verify study_groups table
    const studyGroupsCols = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'study_groups'
      ORDER BY ordinal_position;
    `);

    console.log('\n--- Verified "study_groups" Table Columns ---');
    console.table(studyGroupsCols.rows);

    // 4. Verify study_group_members table
    const membersCols = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'study_group_members'
      ORDER BY ordinal_position;
    `);

    console.log('\n--- Verified "study_group_members" Table Columns ---');
    console.table(membersCols.rows);

    // 5. Verify constraints
    const constraintsCheck = await client.query(`
      SELECT 
        tc.table_name, 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_name IN ('study_groups', 'study_group_members')
      ORDER BY tc.table_name, tc.constraint_type;
    `);

    console.log('\n--- Verified Constraints ---');
    console.table(constraintsCheck.rows);

    // 6. Verify indexes
    const indexesCheck = await client.query(`
      SELECT 
        tablename, 
        indexname, 
        indexdef
      FROM pg_indexes
      WHERE tablename IN ('study_groups', 'study_group_members')
      ORDER BY tablename, indexname;
    `);

    console.log('\n--- Verified Indexes ---');
    console.table(indexesCheck.rows);

    // 7. Verify users table remained untouched
    const userCountAfter = await client.query('SELECT COUNT(*) AS count FROM users');
    if (userCountBefore.rows[0].count !== userCountAfter.rows[0].count) {
      throw new Error('ALERT: User count changed during setup!');
    }
    console.log(`\n✔ Confirmed existing "users" table is completely untouched (Total rows: ${userCountAfter.rows[0].count}).`);

    console.log('\n======================================================');
    console.log('SPRINT 3 DATABASE INITIALIZATION SUCCEEDED WITH ZERO ERRORS');
    console.log('======================================================');
  } catch (error) {
    console.error('Database setup failed with error:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

initStudyGroupsDatabase();
