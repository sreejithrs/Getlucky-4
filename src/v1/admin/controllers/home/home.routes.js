const { Router } = require('express');
const homeController = require('./home');

const router = Router();

router.get('/home', homeController.getHomeStatistics);

module.exports = router;
