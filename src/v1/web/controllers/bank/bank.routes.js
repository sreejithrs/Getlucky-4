const { Router } = require('express');
const userController = require('./bank');

const router = Router();

router.post('/user/banks', userController.addBankAccount);
router.put('/user/banks', userController.updateBankAccount);
router.get('/user/banks', userController.getBankAccounts);
router.get('/user/banks/:bankId', userController.getABankAccount);
router.delete('/user/banks/:bankId', userController.deleteABankAccount);
router.post('/user/western-union', userController.addWesternUnion);

module.exports = router;
