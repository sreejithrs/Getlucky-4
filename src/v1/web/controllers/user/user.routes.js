const { Router } = require('express');
const userController = require('./user');

const router = Router();

router.get('/user/profile', userController.getProfile);
router.put('/user/profile', userController.updateProfile);
router.delete('/user/profile', userController.deleteAccount);
router.post('/user/email/send-otp', userController.changeEmailRequest);
router.patch('/user/email/change-email', userController.updateEmail);
// router.get('/user/transactions', userController.getUserTransactions);
router.get('/user/my-tickets', userController.getUserTickets);

module.exports = router;
