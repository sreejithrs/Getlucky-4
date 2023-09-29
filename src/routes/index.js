const { Router } = require('express');
const { requireApiKey } = require('../middlewares/apiRequest');
const userV1 = require('./v1/user');
const adminV1 = require('./v1/admin');
const commonV1 = require('../v1/common/common.routes');

const router = Router();

router.use(requireApiKey);
require('../helpers/passport');

router.use('/admin', adminV1);
router.use('/web', userV1);
router.use('/', commonV1);

module.exports = router;
