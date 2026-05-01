// ─── Log Routes ─────────────────────────────────────────────────
const router     = require('express').Router();
const auth       = require('../middleware/auth');
const authorize  = require('../middleware/role');
const controller = require('../controllers/log.controller');

router.get('/login', auth, authorize(2), controller.getLoginLogs);
router.get('/audit', auth, authorize(1), controller.getAuditLogs);

module.exports = router;
