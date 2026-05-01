// ─── Employee Routes ────────────────────────────────────────────
const router     = require('express').Router();
const auth       = require('../middleware/auth');
const authorize  = require('../middleware/role');
const controller = require('../controllers/employee.controller');

router.get('/',       auth, authorize(2), controller.getAll);
router.get('/:id',    auth, authorize(2), controller.getById);
router.post('/',      auth, authorize(2), controller.create);
router.put('/:id',    auth, authorize(2), controller.update);
router.delete('/:id', auth, authorize(1), controller.remove);

module.exports = router;
