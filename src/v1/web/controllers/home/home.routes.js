const passport = require('passport');
const { Router } = require('express');
const homeController = require('./home');

const requireAuth = passport.authenticate('accessTokenAuth', { session: false });

const router = Router();

router.get('/home/play', homeController.getProducts);
router.post('/home/order', requireAuth, homeController.createOrder);

module.exports = router;
