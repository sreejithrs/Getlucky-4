const passport = require('passport');
const { Router } = require('express');
const authController = require('./auth');

const router = Router();

const requireAuth = passport.authenticate('accessTokenAuth', { session: false });

router.post('/auth/re-gi-ster', authController.adminSignUp);
router.post('/auth/login', authController.adminSignIn);
router.get('/users/:page/:limit', requireAuth, authController.usersList);
router.post('/users/wallet-recharge', requireAuth, authController.addMoneyToWallet);

module.exports = router;
