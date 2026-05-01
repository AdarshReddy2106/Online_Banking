// ─── Beneficiary Controller ─────────────────────────────────────
const pool = require('../config/db');

// Helper: get customer_id for the logged-in user
const getCustomerId = async (userId) => {
  const r = await pool.query('SELECT customer_id FROM customer WHERE user_id = $1', [userId]);
  return r.rows.length ? r.rows[0].customer_id : null;
};

exports.getAll = async (req, res) => {
  try {
    const custId = await getCustomerId(req.user.user_id);
    if (!custId) return res.status(404).json({ error: 'Customer not found.' });
    const result = await pool.query(
      'SELECT * FROM beneficiary WHERE customer_id = $1 ORDER BY beneficiary_id', [custId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch beneficiaries.' });
  }
};

exports.create = async (req, res) => {
  try {
    const custId = await getCustomerId(req.user.user_id);
    if (!custId) return res.status(404).json({ error: 'Customer not found.' });
    const { beneficiary_account, beneficiary_name, bank_name, ifsc_code } = req.body;
    if (!beneficiary_account || !beneficiary_name)
      return res.status(400).json({ error: 'beneficiary_account and beneficiary_name required.' });
    const result = await pool.query(
      `INSERT INTO beneficiary (customer_id, beneficiary_account, beneficiary_name, bank_name, ifsc_code)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [custId, beneficiary_account, beneficiary_name, bank_name || null, ifsc_code || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add beneficiary.' });
  }
};

exports.update = async (req, res) => {
  try {
    const custId = await getCustomerId(req.user.user_id);
    const { id } = req.params;
    const { beneficiary_name, bank_name, ifsc_code, status } = req.body;
    const result = await pool.query(
      `UPDATE beneficiary SET beneficiary_name=COALESCE($1,beneficiary_name),
       bank_name=COALESCE($2,bank_name), ifsc_code=COALESCE($3,ifsc_code),
       status=COALESCE($4,status)
       WHERE beneficiary_id=$5 AND customer_id=$6 RETURNING *`,
      [beneficiary_name, bank_name, ifsc_code, status, id, custId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Beneficiary not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update beneficiary.' });
  }
};

exports.remove = async (req, res) => {
  try {
    const custId = await getCustomerId(req.user.user_id);
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM beneficiary WHERE beneficiary_id = $1 AND customer_id = $2 RETURNING *',
      [id, custId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Beneficiary not found.' });
    res.json({ message: 'Beneficiary removed.', beneficiary: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove beneficiary.' });
  }
};
