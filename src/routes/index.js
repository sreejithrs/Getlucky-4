const { Router } = require('express');
const { requireApiKey } = require('../middlewares/apiRequest');
const userV1 = require('./v1/user');
const adminv1 = require('./v1/admin');

const router = Router();

router.use(requireApiKey);
require('../helpers/passport');

router.use('/admin', adminv1);
router.use('/', userV1);

module.exports = router;
