const { Router } = require('express');
const authController = require('./auth');

const router = Router();

router.post('/auth/register', authController.adminSignUp);
router.post('/auth/login', authController.adminSignIn);
router.post('/users', authController.usersList);

module.exports = router;
