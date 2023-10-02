const { Router } = require('express');
const drawController = require('./draw');

const router = Router();

router.get('/draws', drawController.getDrawList);
router.get('/draws/shows', drawController.pastDrawShows);
router.get('/draws/:drawId/result', drawController.getDrawResult);

module.exports = router;
