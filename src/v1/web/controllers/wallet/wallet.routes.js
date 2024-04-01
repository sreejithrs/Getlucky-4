const { Router } = require('express');
const userController = require('./wallet');

const router = Router();

router.get('/wallet', userController.getUserWallet);
router.post('/wallet/withdraw', userController.sendWithdrawRequest);
router.put('/wallet/withdraw', userController.updateWalletRequest);
router.delete('/wallet/withdraw/:deleteId', userController.deleteWalletRequest);
router.get('/wallet/transactions', userController.walletTransactions);
router.post('/wallet/purchase', userController.walletPurchaseOrder);

module.exports = router;
