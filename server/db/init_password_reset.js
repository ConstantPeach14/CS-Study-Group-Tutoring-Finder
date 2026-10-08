const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

async function initPasswordResetDatabase() {
  const client = await pool.connect();
  try {
    const usersTable = await client.query(`
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = current_schema() AND table_name = 'users'
    `);

    if (usersTable.rows.length === 0) {
      throw new Error('The users table was not found; password reset migration was not applied.');
    }

    const schema = fs.readFileSync(path.join(__dirname, 'schema_password_reset.sql'), 'utf8');
    await client.query(schema);
    console.log('Password reset token schema initialized.');
  } catch (error) {
    console.error('Password reset schema initialization failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  initPasswordResetDatabase();
}

module.exports = { initPasswordResetDatabase };
