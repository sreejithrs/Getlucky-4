const { Router } = require('express');
const drawController = require('./draw');

const router = Router();

router.get('/draws', drawController.getDrawList);
router.get('/draws/:drawId', drawController.getADraw);
router.post('/draws', drawController.createDraw);
router.put('/draws', drawController.updateDraw);
router.post('/draws/:drawId/publish', drawController.publishDraw);
router.get('/draws/:drawId/result', drawController.getDrawResult);
router.get('/draws/:drawId/winners', drawController.getWinners);

module.exports = router;
