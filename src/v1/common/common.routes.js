const { Router } = require('express');
const commonController = require('./common');

const router = Router();

router.get('/states/:country', commonController.getStates);
router.get('/country', commonController.getCountries);

module.exports = router;
