// modules
const passport = require('passport');

// helpers
const { Router } = require('express');
const { adminAllowed } = require('../../middlewares/checkAccessControl');
const authRoutes = require('../../v1/admin/controllers/auth/auth.routes');
const productRoutes = require('../../v1/admin/controllers/product/product.routes');
const drawRoutes = require('../../v1/admin/controllers/draw/draw.routes');

const requireAuth = passport.authenticate('accessTokenAuth', { session: false });

const router = Router();

router.use(authRoutes);

/**
* Routes for only authenticated and allowed admin
*/
router.use(requireAuth);
router.use(adminAllowed);
router.use(productRoutes);
router.use(drawRoutes);

module.exports = router;
