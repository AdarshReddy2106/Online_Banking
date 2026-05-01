// ─── Auth Controller ────────────────────────────────────────────
const pool   = require('../config/db');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET     = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS    = 10;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

// ── Helper: build JWT ───────────────────────────────────────────
const signToken = (user, roleName) =>
  jwt.sign(
    {
      user_id:   user.user_id,
      username:  user.username,
      role_id:   user.role_id,
      role_name: roleName,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  const client = await pool.connect();
  try {
    const { username, password, role_id = 4, name, dob, gender, phone, email, address } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Check if username already exists
    const exists = await client.query('SELECT 1 FROM user_login WHERE username = $1', [username]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await client.query('BEGIN');

    // Insert into user_login
    const userResult = await client.query(
      `INSERT INTO user_login (username, password_hash, role_id)
       VALUES ($1, $2, $3) RETURNING user_id, username, role_id`,
      [username, hashedPassword, role_id]
    );
    const newUser = userResult.rows[0];

    // If Account Holder (role_id = 4), also create a customer record
    if (Number(role_id) === 4) {
      await client.query(
        `INSERT INTO customer (user_id, name, dob, gender, phone, email, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [newUser.user_id, name || null, dob || null, gender || null, phone || null, email || null, address || null]
      );
    }

    await client.query('COMMIT');

    // Fetch role name
    const roleResult = await client.query('SELECT role_name FROM role WHERE role_id = $1', [newUser.role_id]);
    const roleName   = roleResult.rows[0]?.role_name || 'Unknown';

    const token = signToken(newUser, roleName);

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        user_id:   newUser.user_id,
        username:  newUser.username,
        role_id:   newUser.role_id,
        role_name: roleName,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed.' });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Fetch user
    const userResult = await pool.query(
      `SELECT u.*, r.role_name
       FROM user_login u
       JOIN role r ON u.role_id = r.role_id
       WHERE u.username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.account_locked) {
      return res.status(403).json({ error: 'Account is locked. Contact admin.' });
    }

    // Compare password — try bcrypt first, then plaintext fallback for legacy data
    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, user.password_hash);
    } catch (_) {
      // password_hash is not a bcrypt hash (legacy plain text)
      validPassword = (password === user.password_hash);
    }

    if (!validPassword) {
      // Increment failed attempts, lock if >= 5
      const newAttempts = user.failed_attempts + 1;
      const locked      = newAttempts >= 5;
      await pool.query(
        'UPDATE user_login SET failed_attempts = $1, account_locked = $2 WHERE user_id = $3',
        [newAttempts, locked, user.user_id]
      );
      return res.status(401).json({
        error: 'Invalid credentials.',
        failed_attempts: newAttempts,
        account_locked:  locked,
      });
    }

    // Reset failed attempts on success
    await pool.query(
      'UPDATE user_login SET failed_attempts = 0 WHERE user_id = $1',
      [user.user_id]
    );

    // Log the login
    await pool.query(
      `INSERT INTO login_log (user_id, user_type, status)
       VALUES ($1, $2, 'success')`,
      [user.user_id, user.role_name]
    );

    const token = signToken(user, user.role_name);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        user_id:   user.user_id,
        username:  user.username,
        role_id:   user.role_id,
        role_name: user.role_name,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed.' });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const { user_id, role_id } = req.user;

    const userResult = await pool.query(
      `SELECT u.user_id, u.username, u.role_id, r.role_name, u.created_at
       FROM user_login u
       JOIN role r ON u.role_id = r.role_id
       WHERE u.user_id = $1`,
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const profile = userResult.rows[0];

    // Attach extra info based on role
    if (Number(role_id) === 4) {
      const cust = await pool.query('SELECT * FROM customer WHERE user_id = $1', [user_id]);
      profile.customer = cust.rows[0] || null;
    } else if (Number(role_id) === 3) {
      const emp = await pool.query('SELECT * FROM employee WHERE user_id = $1', [user_id]);
      profile.employee = emp.rows[0] || null;
    }

    res.json(profile);
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ error: 'Could not fetch profile.' });
  }
};
