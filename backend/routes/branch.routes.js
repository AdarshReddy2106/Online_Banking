// ─── Branch Routes ──────────────────────────────────────────────
const router     = require('express').Router();
const auth       = require('../middleware/auth');
const authorize  = require('../middleware/role');
const controller = require('../controllers/branch.controller');

router.get('/heads',            auth, authorize(1), controller.getHeads);
router.get('/managers',         auth, authorize(1), controller.getManagers);
router.get('/',                 auth, controller.getAll);
router.get('/:id',              auth, controller.getById);
router.post('/',                auth, authorize(1), controller.create);
router.put('/:id',              auth, authorize(1), controller.update);
router.get('/:id/employees',    auth, authorize(2), controller.getEmployeesByBranch);

module.exports = router;
