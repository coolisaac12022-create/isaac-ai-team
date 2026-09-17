const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    })
  : null;

async function checkDatabaseStatus() {
  if (!pool) {
    return {
      connected: false,
      status: 'not_configured',
      details: 'DATABASE_URL is not set'
    };
  }

  try {
    await pool.query('SELECT 1');
    return { connected: true, status: 'ok' };
  } catch (error) {
    console.error('Database check failed:', error.message);
    return {
      connected: false,
      status: 'error',
      details: error.message
    };
  }
}

module.exports = { pool, checkDatabaseStatus };
