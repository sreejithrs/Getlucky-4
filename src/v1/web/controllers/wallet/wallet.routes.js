const { Router } = require('express');
const userController = require('./wallet');

const router = Router();

router.get('/wallet', userController.getUserWallet);
router.post('/wallet/withdraw', userController.sendWithdrawRequest);
router.put('/wallet/withdraw', userController.updateWalletRequest);

module.exports = router;
