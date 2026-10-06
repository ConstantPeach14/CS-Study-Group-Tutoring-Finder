const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

// Note: Automatic course/module seeding has been disabled per Phase 6 requirements.
// The modules directory operates strictly on manually created courses.

async function initModulesDatabase() {
  console.log('--- Starting Phase 6 Module Directory Database Setup (Schema Only, Zero Seeding) ---');

  const client = await pool.connect();
  try {
    // 1. Verify existing users table
    const usersTableCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users';
    `);

    if (usersTableCheck.rows.length === 0) {
      throw new Error('FATAL: Existing "users" table was not found! Aborting setup.');
    }
    console.log(`✔ Verified existing "users" table is intact.`);

    // 2. Read and execute schema_modules.sql (creates tables if not exists)
    const sqlPath = path.join(__dirname, 'schema_modules.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing schema_modules.sql against Neon PostgreSQL...');
    await client.query(sqlContent);
    console.log('✔ Schema execution completed successfully (No dummy records or seeds inserted).');

    // 3. Verify modules count without modifying data
    const modulesCount = await client.query('SELECT COUNT(*) AS count FROM modules;');
    console.log(`✔ Current total modules in directory: ${modulesCount.rows[0].count}`);

    console.log('\n======================================================');
    console.log('PHASE 6 MODULES SCHEMA INITIALIZATION COMPLETED (ZERO SEEDS)!');
    console.log('======================================================');
  } catch (error) {

    console.error('Database setup failed with error:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  initModulesDatabase();
}

module.exports = { initModulesDatabase };
