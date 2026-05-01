// ─── Beneficiary Routes ─────────────────────────────────────────
const router     = require('express').Router();
const auth       = require('../middleware/auth');
const authorize  = require('../middleware/role');
const controller = require('../controllers/beneficiary.controller');

// All beneficiary ops are for Account Holders (role 4)
router.get('/',       auth, authorize(4), controller.getAll);
router.post('/',      auth, authorize(4), controller.create);
router.put('/:id',    auth, authorize(4), controller.update);
router.delete('/:id', auth, authorize(4), controller.remove);

module.exports = router;
