// ─── Customer Routes ────────────────────────────────────────────
const router     = require('express').Router();
const auth       = require('../middleware/auth');
const authorize  = require('../middleware/role');
const controller = require('../controllers/customer.controller');

router.get('/profile', auth, controller.getProfile);
router.get('/',        auth, authorize(3), controller.getAll);
router.get('/:id',     auth, controller.getById);
router.put('/:id',     auth, controller.update);

module.exports = router;
