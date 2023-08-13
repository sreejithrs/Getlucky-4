const passport = require('passport');
const { Router } = require('express');
const authController = require('./auth');

const router = Router();

const requireRefreshAuth = passport.authenticate('refreshTokenAuth', { session: false });

router.get('/auth/token', requireRefreshAuth, authController.tokenRefresh);
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.put('/auth/reset-password', authController.resetPassword);
router.post('/auth/account/code', authController.sendVerifyCode);
router.post('/auth/account/verify', authController.verifyAccount);

module.exports = router;
