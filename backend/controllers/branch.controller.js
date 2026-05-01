// ─── Branch Controller ──────────────────────────────────────────
const pool = require('../config/db');

// ── GET /api/branches ───────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM branch ORDER BY branch_id');
    res.json(result.rows);
  } catch (err) {
    console.error('getAll branches:', err.message);
    res.status(500).json({ error: 'Failed to fetch branches.' });
  }
};

// ── GET /api/branches/:id ───────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM branch WHERE branch_id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Branch not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getById branch:', err.message);
    res.status(500).json({ error: 'Failed to fetch branch.' });
  }
};

// ── POST /api/branches ─────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { branch_name, location, contact_number, ifsc_code } = req.body;
    if (!branch_name || !location) {
      return res.status(400).json({ error: 'branch_name and location are required.' });
    }
    const result = await pool.query(
      `INSERT INTO branch (branch_name, location, contact_number, ifsc_code)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [branch_name, location, contact_number || null, ifsc_code || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('create branch:', err.message);
    res.status(500).json({ error: 'Failed to create branch.' });
  }
};

// ── PUT /api/branches/:id ───────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_name, location, contact_number, ifsc_code } = req.body;
    const result = await pool.query(
      `UPDATE branch
       SET branch_name    = COALESCE($1, branch_name),
           location       = COALESCE($2, location),
           contact_number = COALESCE($3, contact_number),
           ifsc_code      = COALESCE($4, ifsc_code)
       WHERE branch_id = $5 RETURNING *`,
      [branch_name, location, contact_number, ifsc_code, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Branch not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('update branch:', err.message);
    res.status(500).json({ error: 'Failed to update branch.' });
  }
};

// ── GET /api/branches/:id/employees ─────────────────────────────
exports.getEmployeesByBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM employee WHERE branch_id = $1 ORDER BY employee_id',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getEmployeesByBranch:', err.message);
    res.status(500).json({ error: 'Failed to fetch employees.' });
  }
};

// ── GET /api/branches/heads ─────────────────────────────────────
exports.getHeads = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bh.*, u.username, b.branch_name
       FROM branch_head bh
       JOIN user_login u ON bh.user_id   = u.user_id
       JOIN branch b     ON bh.branch_id = b.branch_id
       ORDER BY bh.branch_head_id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getHeads:', err.message);
    res.status(500).json({ error: 'Failed to fetch branch heads.' });
  }
};

// ── GET /api/branches/managers ──────────────────────────────────
exports.getManagers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, u.username
       FROM manager m
       JOIN user_login u ON m.user_id = u.user_id
       ORDER BY m.manager_id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getManagers:', err.message);
    res.status(500).json({ error: 'Failed to fetch managers.' });
  }
};
