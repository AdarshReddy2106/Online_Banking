// ─── Log Controller ─────────────────────────────────────────────
const pool = require('../config/db');

exports.getLoginLogs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ll.*, u.username FROM login_log ll
       LEFT JOIN user_login u ON ll.user_id = u.user_id
       ORDER BY ll.login_time DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch login logs.' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT al.*, u.username FROM audit_log al
       LEFT JOIN user_login u ON al.user_id = u.user_id
       ORDER BY al.action_time DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
};
