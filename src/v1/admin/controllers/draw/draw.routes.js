const { Router } = require('express');
const drawController = require('./draw');

const router = Router();

router.post('/draws', drawController.createDraw);

module.exports = router;
