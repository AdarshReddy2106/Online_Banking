// ─── Loan Routes ────────────────────────────────────────────────
const router     = require('express').Router();
const auth       = require('../middleware/auth');
const authorize  = require('../middleware/role');
const controller = require('../controllers/loan.controller');

router.get('/',               auth, controller.getAll);
router.get('/:id',            auth, controller.getById);
router.post('/',              auth, authorize(4), controller.apply);
router.put('/:id/approve',    auth, authorize(3), controller.approve);
router.get('/:id/emi',        auth, controller.calculateEmi);
router.get('/:id/payments',   auth, controller.getPayments);
router.post('/:id/payments',  auth, authorize(4), controller.recordPayment);

module.exports = router;
