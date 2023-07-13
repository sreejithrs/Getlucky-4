// modules
const passport = require('passport');

// helpers
const { Router } = require('express');
const authRoutes = require('../../v1/app/controllers/auth/auth.routes');
const { userAllowed } = require('../../middlewares/checkAccessControl');

const requireAuth = passport.authenticate('accessTokenAuth', { session: false });

const router = Router();

router.use(authRoutes);

/**
* Routes for only authenticated and allowed users
*/
router.use(requireAuth);
router.use(userAllowed);


module.exports = router;
