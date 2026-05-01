// ─── Transaction Routes ─────────────────────────────────────────
const router     = require('express').Router();
const auth       = require('../middleware/auth');
const authorize  = require('../middleware/role');
const controller = require('../controllers/transaction.controller');

router.get('/',         auth, controller.getAll);
router.get('/:id',      auth, controller.getById);
router.post('/transfer', auth, authorize(4), controller.transfer);
router.post('/credit',   auth, authorize(3), controller.credit);
router.post('/debit',    auth, authorize(4), controller.debit);

module.exports = router;
