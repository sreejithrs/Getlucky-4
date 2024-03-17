const { Router } = require('express');
const withdrawController = require('./withdraw');

const router = Router();

router.get('/withdraw', withdrawController.getWithdrawList);
router.get('/withdraw/:id', withdrawController.viewWithdrawRequest);
router.post('/withdraw/approve-reject', withdrawController.approveOrRejectRequest);

module.exports = router;
