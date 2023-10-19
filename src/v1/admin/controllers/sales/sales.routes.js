const { Router } = require('express');
const salesController = require('./sales.controller');

const router = Router();

router.get('/sales', salesController.getSales);

module.exports = router;
