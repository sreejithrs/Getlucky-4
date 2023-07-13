// modules
const passport = require('passport');

// helpers
const { Router } = require('express');
const authRoutes = require('../../v1/admin/controllers/auth/auth.routes');
const { adminAllowed } = require('../../middlewares/checkAccessControl');

const requireAuth = passport.authenticate('accessTokenAuth', { session: false });

const router = Router();

router.use(authRoutes);

/**
* Routes for only authenticated and allowed admin
*/
router.use(requireAuth);
router.use(adminAllowed);


module.exports = router;
