// modules
const passport = require('passport');

// helpers
const { Router } = require('express');
const { userAllowed } = require('../../middlewares/checkAccessControl');
const authRoutes = require('../../v1/web/controllers/auth/auth.routes');
const homeRoutes = require('../../v1/web/controllers/home/home.routes');

const requireAuth = passport.authenticate('accessTokenAuth', { session: false });

const router = Router();

router.use(authRoutes);

/**
* Routes for only authenticated and allowed users
*/
router.use(requireAuth);
router.use(userAllowed);
router.use(homeRoutes);

module.exports = router;
