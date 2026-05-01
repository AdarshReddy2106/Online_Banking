// ─── PostgreSQL Connection Pool ─────────────────────────────────
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     process.env.DB_PORT || 5432,
});

// Quick connectivity check on startup
pool.on('connect', () => {
  console.log('✅  Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌  PostgreSQL pool error:', err.message);
});

module.exports = pool;
