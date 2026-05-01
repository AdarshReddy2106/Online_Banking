// ─── Role-Based Authorization Middleware ────────────────────────
//
// Role hierarchy (lower id = higher privilege):
//   1 — Branch Head
//   2 — Manager
//   3 — Employee
//   4 — Account Holder
//
// Usage:  router.get('/admin', authenticate, authorize(2), handler)
//         → allows role_id 1 and 2 (Branch Head & Manager)

/**
 * Returns middleware that allows access only when
 * the authenticated user's role_id <= maxRoleId.
 *
 * @param {number} maxRoleId  – highest (numerically) role_id allowed
 */
const authorize = (maxRoleId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    if (req.user.role_id > maxRoleId) {
      return res.status(403).json({ error: 'Forbidden. Insufficient privileges.' });
    }

    next();
  };
};

module.exports = authorize;
