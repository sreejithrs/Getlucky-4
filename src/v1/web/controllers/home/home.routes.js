const passport = require('passport');
const { Router } = require('express');
const homeController = require('./home');
const { checkAccessToken } = require('../../../../middlewares/checkAccessControl');

const requireAuth = passport.authenticate('accessTokenAuth', { session: false });

const router = Router();

router.get('/home', homeController.getHomePage);
router.get('/home/play', checkAccessToken, homeController.getProducts);
router.post('/home/order', requireAuth, homeController.createOrder);
router.get('/home/order', requireAuth, homeController.getOrder);
router.post('/home/purchase', requireAuth, homeController.purchaseOrder);

module.exports = router;
