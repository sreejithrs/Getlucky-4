const { Router } = require('express');
const homeController = require('./home.controller');

const router = Router();

router.get('/home/statistics', homeController.getHomeStatistics);

module.exports = router;
