// ─── Employee Controller ────────────────────────────────────────
const pool = require('../config/db');

// ── GET /api/employees ──────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.username
       FROM employee e
       JOIN user_login u ON e.user_id = u.user_id
       ORDER BY e.employee_id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getAll employees:', err.message);
    res.status(500).json({ error: 'Failed to fetch employees.' });
  }
};

// ── GET /api/employees/:id ──────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT e.*, u.username
       FROM employee e
       JOIN user_login u ON e.user_id = u.user_id
       WHERE e.employee_id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getById employee:', err.message);
    res.status(500).json({ error: 'Failed to fetch employee.' });
  }
};

// ── POST /api/employees ─────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { user_id, name, branch_id, manager_id, phone, email, hire_date, salary } = req.body;
    if (!user_id || !name || !branch_id) {
      return res.status(400).json({ error: 'user_id, name, and branch_id are required.' });
    }
    const result = await pool.query(
      `INSERT INTO employee (user_id, name, branch_id, manager_id, phone, email, hire_date, salary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user_id, name, branch_id, manager_id || null, phone || null, email || null, hire_date || null, salary || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('create employee:', err.message);
    res.status(500).json({ error: 'Failed to create employee.' });
  }
};

// ── PUT /api/employees/:id ──────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, branch_id, manager_id, phone, email, salary, status } = req.body;
    const result = await pool.query(
      `UPDATE employee
       SET name       = COALESCE($1, name),
           branch_id  = COALESCE($2, branch_id),
           manager_id = COALESCE($3, manager_id),
           phone      = COALESCE($4, phone),
           email      = COALESCE($5, email),
           salary     = COALESCE($6, salary),
           status     = COALESCE($7, status)
       WHERE employee_id = $8 RETURNING *`,
      [name, branch_id, manager_id, phone, email, salary, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('update employee:', err.message);
    res.status(500).json({ error: 'Failed to update employee.' });
  }
};

// ── DELETE /api/employees/:id  (soft delete) ────────────────────
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE employee SET status = 'inactive' WHERE employee_id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found.' });
    res.json({ message: 'Employee deactivated.', employee: result.rows[0] });
  } catch (err) {
    console.error('remove employee:', err.message);
    res.status(500).json({ error: 'Failed to deactivate employee.' });
  }
};
