// ─── PostgreSQL Connection Pool ─────────────────────────────────
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user:     process.env.DB_USER     || 'postgres',
  host:     process.env.DB_HOST     || 'localhost',
  database: process.env.DB_NAME     || 'online_banking_db',
  password: process.env.DB_PASSWORD || 'your_password',
  port:     process.env.DB_PORT     || 5432,
});

// Quick connectivity check on startup
pool.on('connect', () => {
  console.log('✅  Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌  PostgreSQL pool error:', err.message);
});

module.exports = pool;
