// ─── Customer Controller ────────────────────────────────────────
const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.username FROM customer c
       JOIN user_login u ON c.user_id = u.user_id ORDER BY c.customer_id`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.username FROM customer c
       JOIN user_login u ON c.user_id = u.user_id WHERE c.user_id = $1`,
      [req.user.user_id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Profile not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role_id === 4) {
      const own = await pool.query('SELECT customer_id FROM customer WHERE user_id = $1', [req.user.user_id]);
      if (!own.rows.length || own.rows[0].customer_id !== Number(id))
        return res.status(403).json({ error: 'Access denied.' });
    }
    const result = await pool.query(
      `SELECT c.*, u.username FROM customer c
       JOIN user_login u ON c.user_id = u.user_id WHERE c.customer_id = $1`, [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Customer not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role_id === 4) {
      const own = await pool.query('SELECT customer_id FROM customer WHERE user_id = $1', [req.user.user_id]);
      if (!own.rows.length || own.rows[0].customer_id !== Number(id))
        return res.status(403).json({ error: 'Access denied.' });
    }
    const { name, dob, gender, phone, email, address, cibil_score, kyc_verified } = req.body;
    const result = await pool.query(
      `UPDATE customer SET name=COALESCE($1,name), dob=COALESCE($2,dob),
       gender=COALESCE($3,gender), phone=COALESCE($4,phone), email=COALESCE($5,email),
       address=COALESCE($6,address), cibil_score=COALESCE($7,cibil_score),
       kyc_verified=COALESCE($8,kyc_verified)
       WHERE customer_id=$9 RETURNING *`,
      [name, dob, gender, phone, email, address, cibil_score, kyc_verified, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Customer not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer.' });
  }
};
