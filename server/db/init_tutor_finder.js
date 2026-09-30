const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

async function initTutorFinderDB() {
  const client = await pool.connect();
  try {
    console.log('--- Initializing Sprint 4: Tutor Finder Database Tables ---');
    const sqlPath = path.join(__dirname, 'schema_tutor_finder.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);
    console.log('✔ tutor_profiles and tutoring_requests tables and indexes initialized successfully.');
  } catch (error) {
    console.error('Error initializing Tutor Finder tables:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  initTutorFinderDB();
}

module.exports = initTutorFinderDB;
