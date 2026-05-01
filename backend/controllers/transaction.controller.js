// ─── Transaction Controller ─────────────────────────────────────
const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    let result;
    if (req.user.role_id === 4) {
      // Account holders see only transactions involving their accounts
      result = await pool.query(
        `SELECT t.* FROM transaction t
         JOIN account a ON t.from_account = a.account_id OR t.to_account = a.account_id
         JOIN customer c ON a.customer_id = c.customer_id
         WHERE c.user_id = $1
         GROUP BY t.tx_id ORDER BY t.tx_time DESC`, [req.user.user_id]
      );
    } else {
      result = await pool.query('SELECT * FROM transaction ORDER BY tx_time DESC');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transaction WHERE tx_id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Transaction not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transaction.' });
  }
};

// Calls the transfer_money stored procedure
exports.transfer = async (req, res) => {
  try {
    const { from_account, to_account, amount } = req.body;
    if (!from_account || !to_account || !amount)
      return res.status(400).json({ error: 'from_account, to_account, and amount required.' });
    if (Number(amount) <= 0)
      return res.status(400).json({ error: 'Amount must be positive.' });

    // Ownership check
    if (req.user.role_id === 4) {
      const own = await pool.query(
        `SELECT a.account_id FROM account a
         JOIN customer c ON a.customer_id = c.customer_id
         WHERE c.user_id = $1 AND a.account_id = $2`, [req.user.user_id, from_account]
      );
      if (!own.rows.length) return res.status(403).json({ error: 'Access denied.' });
    }

    // Check balance before calling procedure
    const bal = await pool.query('SELECT get_balance($1) AS balance', [from_account]);
    if (Number(bal.rows[0].balance) < Number(amount))
      return res.status(400).json({ error: 'Insufficient balance.' });

    await pool.query('CALL transfer_money($1,$2,$3)', [from_account, to_account, amount]);

    // Return the newly created transaction
    const tx = await pool.query(
      'SELECT * FROM transaction ORDER BY tx_id DESC LIMIT 1'
    );
    res.status(201).json({ message: 'Transfer successful.', transaction: tx.rows[0] });
  } catch (err) {
    console.error('transfer:', err.message);
    res.status(500).json({ error: 'Transfer failed.' });
  }
};

exports.credit = async (req, res) => {
  try {
    const { to_account, amount, remarks } = req.body;
    if (!to_account || !amount)
      return res.status(400).json({ error: 'to_account and amount required.' });

    await pool.query('UPDATE account SET balance = balance + $1 WHERE account_id = $2', [amount, to_account]);

    const ref = 'CR' + Date.now();
    const result = await pool.query(
      `INSERT INTO transaction (from_account,to_account,amount,tx_type,status,reference_no,remarks)
       VALUES (NULL,$1,$2,'credit','success',$3,$4) RETURNING *`,
      [to_account, amount, ref, remarks || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Credit failed.' });
  }
};

exports.debit = async (req, res) => {
  try {
    const { from_account, amount, remarks } = req.body;
    if (!from_account || !amount)
      return res.status(400).json({ error: 'from_account and amount required.' });

    // Ownership check
    if (req.user.role_id === 4) {
      const own = await pool.query(
        `SELECT a.account_id FROM account a
         JOIN customer c ON a.customer_id = c.customer_id
         WHERE c.user_id = $1 AND a.account_id = $2`, [req.user.user_id, from_account]
      );
      if (!own.rows.length) return res.status(403).json({ error: 'Access denied.' });
    }

    const bal = await pool.query('SELECT get_balance($1) AS balance', [from_account]);
    if (Number(bal.rows[0].balance) < Number(amount))
      return res.status(400).json({ error: 'Insufficient balance.' });

    await pool.query('UPDATE account SET balance = balance - $1 WHERE account_id = $2', [amount, from_account]);

    const ref = 'DR' + Date.now();
    const result = await pool.query(
      `INSERT INTO transaction (from_account,to_account,amount,tx_type,status,reference_no,remarks)
       VALUES ($1,NULL,$2,'debit','success',$3,$4) RETURNING *`,
      [from_account, amount, ref, remarks || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Debit failed.' });
  }
};
