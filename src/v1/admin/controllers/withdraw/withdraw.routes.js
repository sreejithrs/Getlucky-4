const { Router } = require('express');
const withdrawController = require('./withdraw');

const router = Router();

router.get('/withdraw', withdrawController.getWithdrawList);

module.exports = router;
