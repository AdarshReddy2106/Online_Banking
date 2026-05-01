// ─── JWT Authentication Middleware ──────────────────────────────
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'online_banking_super_secret_key_2024';

/**
 * Verifies the Bearer token from the Authorization header.
 * On success, attaches `req.user` = { user_id, username, role_id, role_name }.
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;          // { user_id, username, role_id, role_name }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = authenticate;
