const { Router } = require('express');
const homeController = require('./home.controller');

const router = Router();

router.get('/home', homeController.getHomeStatistics);
router.get('/home/download-report', homeController.downloadPurchaseReport);

module.exports = router;
