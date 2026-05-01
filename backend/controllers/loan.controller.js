// ─── Loan Controller ────────────────────────────────────────────
const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    let result;
    if (req.user.role_id === 4) {
      result = await pool.query(
        `SELECT l.* FROM loan l
         JOIN customer c ON l.customer_id = c.customer_id
         WHERE c.user_id = $1 ORDER BY l.loan_id`, [req.user.user_id]
      );
    } else {
      result = await pool.query('SELECT * FROM loan ORDER BY loan_id');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch loans.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM loan WHERE loan_id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Loan not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch loan.' });
  }
};

exports.apply = async (req, res) => {
  try {
    const { account_id, loan_type, loan_amount, interest_rate, tenure_months } = req.body;
    if (!account_id || !loan_type || !loan_amount || !interest_rate || !tenure_months)
      return res.status(400).json({ error: 'All loan fields are required.' });

    // Get customer_id from logged-in user
    const cust = await pool.query('SELECT customer_id FROM customer WHERE user_id = $1', [req.user.user_id]);
    if (!cust.rows.length) return res.status(404).json({ error: 'Customer not found.' });

    const result = await pool.query(
      `INSERT INTO loan (customer_id, account_id, loan_type, loan_amount, interest_rate, tenure_months, start_date, status)
       VALUES ($1,$2,$3,$4,$5,$6, CURRENT_DATE, 'pending') RETURNING *`,
      [cust.rows[0].customer_id, account_id, loan_type, loan_amount, interest_rate, tenure_months]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to apply for loan.' });
  }
};

exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    // Get employee_id of the approver
    const emp = await pool.query('SELECT employee_id FROM employee WHERE user_id = $1', [req.user.user_id]);
    const approvedBy = emp.rows.length ? emp.rows[0].employee_id : null;

    const result = await pool.query(
      `UPDATE loan SET status = 'active', approved_by = $1 WHERE loan_id = $2 RETURNING *`,
      [approvedBy, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Loan not found.' });
    res.json({ message: 'Loan approved.', loan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve loan.' });
  }
};

// Calls the calculate_emi database function
exports.calculateEmi = async (req, res) => {
  try {
    const result = await pool.query('SELECT calculate_emi($1) AS emi', [req.params.id]);
    res.json({ loan_id: Number(req.params.id), emi: result.rows[0].emi });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate EMI.' });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM emi_payment WHERE loan_id = $1 ORDER BY due_date', [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch EMI payments.' });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const { loan_id } = req.params;
    const { emi_amount, due_date, paid_date, payment_status, penalty_amount, tx_id } = req.body;
    if (!emi_amount || !due_date)
      return res.status(400).json({ error: 'emi_amount and due_date are required.' });

    const result = await pool.query(
      `INSERT INTO emi_payment (loan_id, emi_amount, due_date, paid_date, payment_status, penalty_amount, tx_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [loan_id, emi_amount, due_date, paid_date || null, payment_status || 'pending', penalty_amount || 0, tx_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record EMI payment.' });
  }
};
