// modules
const passport = require('passport');

// helpers
const { Router } = require('express');
const { userAllowed } = require('../../middlewares/checkAccessControl');
const authRoutes = require('../../v1/web/controllers/auth/auth.routes');
const homeRoutes = require('../../v1/web/controllers/home/home.routes');
const userRoutes = require('../../v1/web/controllers/user/user.routes');
const drawRoutes = require('../../v1/web/controllers/draws/draw.routes');
const bankRoutes = require('../../v1/web/controllers/bank/bank.routes');
const walletRoutes = require('../../v1/web/controllers/wallet/wallet.routes');

const requireAuth = passport.authenticate('accessTokenAuth', { session: false });

const router = Router();

router.use(authRoutes);
router.use(homeRoutes);
router.use(drawRoutes);

/**
* Routes for only authenticated and allowed users
*/
router.use(requireAuth);
router.use(userAllowed);

router.use(userRoutes);
router.use(bankRoutes);
router.use(walletRoutes);

module.exports = router;
