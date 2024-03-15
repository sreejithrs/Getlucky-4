const { Router } = require('express');
const userController = require('./user');

const router = Router();

router.get('/user/profile', userController.getProfile);
router.put('/user/profile', userController.updateProfile);
router.delete('/user/profile', userController.deleteAccount);
// router.post('/user/profile/change-password', userController.updatePassword);
router.post('/user/email/send-otp', userController.changeEmailRequest);
router.patch('/user/email/change-email', userController.updateEmail);
router.get('/user/transactions', userController.userTransactions);
router.get('/user/my-tickets', userController.userTickets);

module.exports = router;
