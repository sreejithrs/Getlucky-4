const { Router } = require('express');
const commonController = require('./common');

const router = Router();

router.get('/states/:country', commonController.getStates);

module.exports = router;
